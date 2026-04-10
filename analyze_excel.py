import pandas as pd

# 2. Target File
print("=" * 80)
print("2. TARGET FILE")
print("=" * 80)
df_tg = pd.read_excel('upload/608999262570939109_TGApr26(1).xlsx')
print(f"Shape: {df_tg.shape}")
print(f"Columns: {list(df_tg.columns)}")
print(f"\nUnique Branches: {sorted(df_tg['BRANCH NAME'].unique().tolist())}")
print(f"Unique Officers: {df_tg['NAME'].nunique()}")
print(f"Unique Positions: {df_tg['POSISION'].unique().tolist()}")
print(f"Total stats: min={df_tg['Total'].min()}, max={df_tg['Total'].max()}, mean={df_tg['Total'].mean():.0f}")
# Category targets
for col in ['Mac', 'iPad', 'iPhone', 'Apple Watch', 'BTB(Apple)', 'BTB', 'Desktop', 'DIY', 'Notebook', 'Smartphone', 'Tablet', 'SIM']:
    total = df_tg[col].sum()
    print(f"  {col} target total: {total:,.0f}")

# 3. Current Period
print("\n" + "=" * 80)
print("3. CURRENT PERIOD")
print("=" * 80)
df_cur = pd.read_excel('upload/608999262386651188_CurrentApr(1).xlsx')
print(f"Shape: {df_cur.shape}")
print(f"\nUnique Branches: {df_cur['Branch (Name)'].nunique()}")
print(f"Branch names sample: {sorted(df_cur['Branch (Name)'].unique().tolist())[:5]}")
print(f"Unique Categories: {df_cur['Category (Name)'].nunique()}")
cats = sorted(df_cur['Category (Name)'].unique().tolist())
print(f"All Categories: {cats}")
print(f"Unique Sub Categories: {df_cur['Sub Category'].nunique()}")
print(f"Unique Officers: {df_cur['Officer (Name)'].nunique()}")
print(f"Total Price sum: {df_cur['Total Price'].sum():,.0f}")
print(f"Number column sum: {df_cur['Number'].sum():,.0f}")

# Sales by category
print("\nSales by Category (Total Price):")
cat_sales = df_cur.groupby('Category (Name)')['Total Price'].sum().sort_values(ascending=False)
for cat, val in cat_sales.head(15).items():
    print(f"  {cat}: {val:,.0f}")

# Sales by branch
print("\nSales by Branch (Total Price):")
branch_sales = df_cur.groupby('Branch (Name)')['Total Price'].sum().sort_values(ascending=False)
for br, val in branch_sales.items():
    print(f"  {br}: {val:,.0f}")

# 4. Last Month
print("\n" + "=" * 80)
print("4. LAST MONTH")
print("=" * 80)
df_lm = pd.read_excel('upload/608999263241765333_LastmomMar26(1).xlsx')
print(f"Shape: {df_lm.shape}")
print(f"Unique Branches: {df_lm['Branch (Name)'].nunique()}")
print(f"Unique Categories: {df_lm['Category (Name)'].nunique()}")
print(f"Total Price sum: {df_lm['Total Price'].sum():,.0f}")

# 5. Last Year
print("\n" + "=" * 80)
print("5. LAST YEAR (YoY)")
print("=" * 80)
df_ly = pd.read_excel('upload/665C23C38FBC09912BC8CD0043F1700D2945DFDF_LastYOYAPR25(1).xlsx')
print(f"Shape: {df_ly.shape}")
print(f"Unique Branches: {df_ly['Branch (Name)'].nunique()}")
print(f"Unique Categories: {df_ly['Category (Name)'].nunique()}")
print(f"Total Price sum: {df_ly['Total Price'].sum():,.0f}")
