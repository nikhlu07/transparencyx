import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import networkx as nx

class ProcurementDataAnalyzer:
    """
    Analyzes procurement data for patterns and relationships
    """
    
    def __init__(self):
        """Initialize the data analyzer"""
        pass
    
    def analyze_payment_patterns(self, claims_df, supplier_payments_df=None, subsupplier_payments_df=None):
        """
        Analyze payment patterns for suspicious activity
        
        Args:
            claims_df: DataFrame with claims data
            supplier_payments_df: Optional DataFrame with supplier payments
            subsupplier_payments_df: Optional DataFrame with subsupplier payments
            
        Returns:
            dict: Analysis results
        """
        results = {}
        
        # Basic claim analysis
        if not claims_df.empty:
            results['claim_stats'] = self._analyze_claims(claims_df)
        
        # Analyze payment flow if supplier data is available
        if supplier_payments_df is not None and not supplier_payments_df.empty:
            results['supplier_flow'] = self._analyze_supplier_flow(
                claims_df, 
                supplier_payments_df,
                subsupplier_payments_df
            )
        
        # Analyze timing patterns
        if 'create_time' in claims_df.columns:
            results['timing_patterns'] = self._analyze_timing(claims_df)
        
        # Analyze vendor patterns
        if 'vendor_address' in claims_df.columns:
            results['vendor_patterns'] = self._analyze_vendors(claims_df)
        
        return results
    
    def _analyze_claims(self, claims_df):
        """Analyze basic claim statistics"""
        # Convert amount to numeric if it's not already
        if claims_df['amount'].dtype == 'object':
            claims_df['amount'] = pd.to_numeric(claims_df['amount'], errors='coerce')
        
        # Calculate basic statistics
        stats = {
            'total_claims': len(claims_df),
            'total_amount': claims_df['amount'].sum(),
            'avg_amount': claims_df['amount'].mean(),
            'median_amount': claims_df['amount'].median(),
            'max_amount': claims_df['amount'].max(),
            'min_amount': claims_df['amount'].min(),
            'std_amount': claims_df['amount'].std()
        }
        
        # Identify unusually large claims (Z-score > 2)
        mean = claims_df['amount'].mean()
        std = claims_df['amount'].std()
        if std > 0:
            outliers = claims_df[abs((claims_df['amount'] - mean) / std) > 2]
            stats['large_outliers'] = len(outliers)
            stats['large_outlier_pct'] = len(outliers) / len(claims_df) * 100 if len(claims_df) > 0 else 0
        
        # Check for threshold-splitting (many claims just below approval thresholds)
        # This is a common fraud pattern
        if 'department_address' in claims_df.columns:
            # Group by department and check for clusters just below threshold
            dept_groups = claims_df.groupby('department_address')
            threshold_split_depts = []
            
            for dept, group in dept_groups:
                # Look for clusters just below common thresholds (e.g., 10k, 50k, 100k)
                for threshold in [10000, 50000, 100000]:
                    just_below = group[(group['amount'] > threshold * 0.9) & 
                                       (group['amount'] < threshold)]
                    if len(just_below) >= 3:  # At least 3 claims just below threshold
                        threshold_split_depts.append({
                            'department': dept,
                            'threshold': threshold,
                            'count': len(just_below),
                            'total_amount': just_below['amount'].sum()
                        })
            
            stats['threshold_splitting'] = threshold_split_depts
        
        return stats
    
    def _analyze_supplier_flow(self, claims_df, supplier_payments_df, subsupplier_payments_df=None):
        """Analyze the flow of funds from claims to suppliers and subsuppliers"""
        results = {}
        
        # Ensure we have claim IDs in both dataframes
        if 'claim_id' not in supplier_payments_df.columns:
            return {'error': 'Supplier payments data missing claim_id field'}
        
        # Convert amounts to numeric
        claims_df['amount'] = pd.to_numeric(claims_df['amount'], errors='coerce')
        supplier_payments_df['amount'] = pd.to_numeric(supplier_payments_df['amount'], errors='coerce')
        
        # Merge claims with supplier payments
        merged = pd.merge(
            claims_df, 
            supplier_payments_df.groupby('claim_id')['amount'].sum().reset_index(),
            on='claim_id',
            how='left',
            suffixes=('_claim', '_supplier')
        )
        
        # Fill missing supplier payments with 0
        merged['amount_supplier'] = merged['amount_supplier'].fillna(0)
        
        # Calculate retention rate (how much vendors keep vs. pay to suppliers)
        merged['retention_amount'] = merged['amount_claim'] - merged['amount_supplier']
        merged['retention_rate'] = merged['retention_amount'] / merged['amount_claim']
        
        # Calculate statistics
        results['avg_retention_rate'] = merged['retention_rate'].mean()
        results['median_retention_rate'] = merged['retention_rate'].median()
        
        # Identify vendors with unusually high retention rates
        high_retention = merged[merged['retention_rate'] > 0.8]  # Keeping more than 80%
        results['high_retention_count'] = len(high_retention)
        
        if len(high_retention) > 0:
            results['high_retention_vendors'] = high_retention.groupby('vendor_address').agg({
                'claim_id': 'count',
                'amount_claim': 'sum',
                'retention_amount': 'sum',
                'retention_rate': 'mean'
            }).reset_index().to_dict('records')
        
        # Analyze subsupplier flow if data is available
        if subsupplier_payments_df is not None and not subsupplier_payments_df.empty:
            results['subsupplier_analysis'] = self._analyze_subsupplier_flow(
                supplier_payments_df,
                subsupplier_payments_df
            )
        
        return results
    
    def _analyze_subsupplier_flow(self, supplier_payments_df, subsupplier_payments_df):
        """Analyze the flow of funds from suppliers to subsuppliers"""
        results = {}
        
        # Ensure necessary columns exist
        required_cols = ['supplier_payment_id', 'amount']
        if not all(col in subsupplier_payments_df.columns for col in required_cols):
            return {'error': 'Subsupplier payments data missing required fields'}
        
        # Convert amounts to numeric
        supplier_payments_df['amount'] = pd.to_numeric(supplier_payments_df['amount'], errors='coerce')
        subsupplier_payments_df['amount'] = pd.to_numeric(subsupplier_payments_df['amount'], errors='coerce')
        
        # Merge supplier payments with subsupplier payments
        merged = pd.merge(
            supplier_payments_df,
            subsupplier_payments_df.groupby('supplier_payment_id')['amount'].sum().reset_index(),
            on='supplier_payment_id',
            how='left',
            suffixes=('_supplier', '_subsupplier')
        )
        
        # Fill missing subsupplier payments with 0
        merged['amount_subsupplier'] = merged['amount_subsupplier'].fillna(0)
        
        # Calculate retention rate (how much suppliers keep vs. pay to subsuppliers)
        merged['retention_amount'] = merged['amount_supplier'] - merged['amount_subsupplier']
        merged['retention_rate'] = merged['retention_amount'] / merged['amount_supplier']
        
        # Calculate statistics
        results['avg_retention_rate'] = merged['retention_rate'].mean()
        results['median_retention_rate'] = merged['retention_rate'].median()
        
        # Identify suppliers with unusually high retention rates
        high_retention = merged[merged['retention_rate'] > 0.8]  # Keeping more than 80%
        results['high_retention_count'] = len(high_retention)
        
        if len(high_retention) > 0:
            results['high_retention_suppliers'] = high_retention.groupby('supplier').agg({
                'supplier_payment_id': 'count',
                'amount_supplier': 'sum',
                'amount_subsupplier': 'sum',
                'retention_amount': 'sum',
                'retention_rate': 'mean'
            }).reset_index().to_dict('records')
        
        # Analyze payment concentration
        if 'subsupplier' in subsupplier_payments_df.columns:
            subsupplier_counts = subsupplier_payments_df.groupby('subsupplier').agg({
                'amount': ['count', 'sum']
            }).reset_index()
            subsupplier_counts.columns = ['subsupplier', 'payment_count', 'total_amount']
            
            # Calculate concentration ratio (top 4 subsuppliers' share)
            total_amount = subsupplier_counts['total_amount'].sum()
            top_4_amount = subsupplier_counts.nlargest(4, 'total_amount')['total_amount'].sum()
            results['concentration_ratio'] = top_4_amount / total_amount if total_amount > 0 else 0
            
            # Flag high concentration
            results['high_concentration'] = results['concentration_ratio'] > 0.8
            results['top_subsuppliers'] = subsupplier_counts.nlargest(4, 'total_amount').to_dict('records')
        
        return results
    
    def _analyze_timing(self, claims_df):
        """Analyze claim timing patterns for suspicious activity"""
        results = {}
        
        # Convert create_time to datetime
        claims_df['create_time'] = pd.to_datetime(claims_df['create_time'], errors='coerce')
        
        # Filter valid timestamps
        valid_times = claims_df['create_time'].notna()
        if valid_times.sum() == 0:
            return {'error': 'No valid timestamp data available'}
        
        temp_df = claims_df[valid_times].copy()
        
        # Extract time features
        temp_df['day_of_week'] = temp_df['create_time'].dt.dayofweek
        temp_df['hour'] = temp_df['create_time'].dt.hour
        temp_df['is_weekend'] = temp_df['day_of_week'].isin([5, 6]).astype(int)
        
        # Analyze claims by day of week
        dow_counts = temp_df.groupby('day_of_week').agg({
            'claim_id': 'count',
            'amount': 'sum'
        }).reset_index()
        dow_counts.columns = ['day_of_week', 'claim_count', 'total_amount']
        
        results['day_of_week_patterns'] = dow_counts.to_dict('records')
        
        # Flag late-night submissions
        late_night = temp_df[temp_df['hour'].isin([22, 23, 0, 1, 2, 3])]
        results['late_night_submissions'] = {
            'count': len(late_night),
            'percentage': len(late_night) / len(temp_df) * 100 if len(temp_df) > 0 else 0,
            'total_amount': late_night['amount'].sum()
        }
        
        # Check for end-of-period rushes
        temp_df['month_end'] = temp_df['create_time'].dt.day >= 25
        temp_df['quarter_end'] = (temp_df['create_time'].dt.month.isin([3, 6, 9, 12]) & 
                                 (temp_df['create_time'].dt.day >= 25))
        
        month_end = temp_df[temp_df['month_end']]
        quarter_end = temp_df[temp_df['quarter_end']]
        
        results['month_end_rush'] = {
            'count': len(month_end),
            'percentage': len(month_end) / len(temp_df) * 100 if len(temp_df) > 0 else 0,
            'total_amount': month_end['amount'].sum()
        }
        
        results['quarter_end_rush'] = {
            'count': len(quarter_end),
            'percentage': len(quarter_end) / len(temp_df) * 100 if len(temp_df) > 0 else 0,
            'total_amount': quarter_end['amount'].sum()
        }
        
        return results
    
    def _analyze_vendors(self, claims_df):
        """Analyze vendor patterns for suspicious activity"""
        results = {}
        
        # Group by vendor
        vendor_groups = claims_df.groupby('vendor_address').agg({
            'claim_id': 'count',
            'amount': ['sum', 'mean', 'std'],
            'create_time': ['min', 'max']
        }).reset_index()
        
        vendor_groups.columns = [
            'vendor_address', 'claim_count', 'total_amount', 
            'avg_amount', 'std_amount', 'first_claim', 'last_claim'
        ]
        
        # Calculate vendor concentration
        total_claims = len(claims_df)
        total_amount = claims_df['amount'].sum()
        
        top_vendors = vendor_groups.nlargest(5, 'claim_count')
        results['vendor_concentration'] = {
            'top_5_vendors': top_vendors.to_dict('records'),
            'top_5_claim_pct': top_vendors['claim_count'].sum() / total_claims * 100 if total_claims > 0 else 0,
            'top_5_amount_pct': top_vendors['total_amount'].sum() / total_amount * 100 if total_amount > 0 else 0
        }
        
        # Identify new vendors
        recent_threshold = datetime.now() - timedelta(days=30)
        new_vendors = vendor_groups[pd.to_datetime(vendor_groups['first_claim']) > recent_threshold]
        
        results['new_vendors'] = {
            'count': len(new_vendors),
            'total_amount': new_vendors['total_amount'].sum(),
            'vendors': new_vendors[['vendor_address', 'claim_count', 'total_amount']].to_dict('records')
        }
        
        # Flag high-variance vendors
        high_variance = vendor_groups[vendor_groups['std_amount'] > vendor_groups['avg_amount']]
        results['high_variance_vendors'] = {
            'count': len(high_variance),
            'vendors': high_variance[['vendor_address', 'avg_amount', 'std_amount']].to_dict('records')
        }
        
        return results
