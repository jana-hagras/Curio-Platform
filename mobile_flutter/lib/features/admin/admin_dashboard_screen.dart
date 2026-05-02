import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/api/api_service.dart';
import '../../models/user_model.dart';
import '../../models/market_item_model.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});
  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 600;
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Row(
          children: [
            if (!isMobile) _buildSidebar(),
            Expanded(
              child: IndexedStack(
                index: _selectedIndex,
                children: const [_OverviewTab(), _UsersTab(), _ProductsTab(), _AnalyticsTab()],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: isMobile ? _buildBottomNav() : null,
    );
  }

  Widget _buildSidebar() {
    return Container(
      width: 220,
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(right: BorderSide(color: AppColors.divider)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 24),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Image.asset('assets/icons/logo.png', width: 36, height: 36),
            const SizedBox(width: 10),
            const Text('CURIO', style: TextStyle(color: AppColors.gold, fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: 4, fontFamily: 'Playfair')),
          ]),
          const SizedBox(height: 6),
          Text('Admin Panel', style: TextStyle(color: AppColors.gold.withValues(alpha: 0.6), fontSize: 11, letterSpacing: 2, fontWeight: FontWeight.w600)),
          const SizedBox(height: 32),
          Divider(color: AppColors.divider, height: 1),
          const SizedBox(height: 16),
          _sideItem(0, Icons.dashboard_rounded, 'Overview'),
          _sideItem(1, Icons.people_rounded, 'Users'),
          _sideItem(2, Icons.inventory_2_rounded, 'Products'),
          _sideItem(3, Icons.analytics_rounded, 'Analytics'),
          const Spacer(),
          Divider(color: AppColors.divider, height: 1),
          ListTile(
            leading: Icon(Icons.logout_rounded, color: AppColors.textMuted, size: 20),
            title: Text('Logout', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
            onTap: () {
              Provider.of<AuthProvider>(context, listen: false).logout();
              Navigator.pushNamedAndRemoveUntil(context, '/login', (_) => false);
            },
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _sideItem(int i, IconData icon, String label) {
    final sel = _selectedIndex == i;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => setState(() => _selectedIndex = i),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: sel ? AppColors.gold.withValues(alpha: 0.1) : Colors.transparent,
            border: sel ? Border.all(color: AppColors.borderGold) : null,
          ),
          child: Row(children: [
            Icon(icon, size: 20, color: sel ? AppColors.gold : AppColors.textMuted),
            const SizedBox(width: 12),
            Text(label, style: TextStyle(color: sel ? AppColors.gold : AppColors.textSecondary, fontSize: 13, fontWeight: sel ? FontWeight.w600 : FontWeight.w400)),
          ]),
        ),
      ),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(color: AppColors.surface, border: Border(top: BorderSide(color: AppColors.divider))),
      child: NavigationBar(
        height: 64, backgroundColor: Colors.transparent, surfaceTintColor: Colors.transparent,
        indicatorColor: AppColors.gold.withValues(alpha: 0.12),
        selectedIndex: _selectedIndex,
        onDestinationSelected: (i) => setState(() => _selectedIndex = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined, color: AppColors.textMuted), selectedIcon: Icon(Icons.dashboard_rounded, color: AppColors.gold), label: 'Overview'),
          NavigationDestination(icon: Icon(Icons.people_outline, color: AppColors.textMuted), selectedIcon: Icon(Icons.people_rounded, color: AppColors.gold), label: 'Users'),
          NavigationDestination(icon: Icon(Icons.inventory_2_outlined, color: AppColors.textMuted), selectedIcon: Icon(Icons.inventory_2_rounded, color: AppColors.gold), label: 'Products'),
          NavigationDestination(icon: Icon(Icons.analytics_outlined, color: AppColors.textMuted), selectedIcon: Icon(Icons.analytics_rounded, color: AppColors.gold), label: 'Analytics'),
        ],
      ),
    );
  }
}

// ─── Overview Tab ─────────────────────────────────────────────────────────
class _OverviewTab extends StatefulWidget {
  const _OverviewTab();
  @override
  State<_OverviewTab> createState() => _OverviewTabState();
}

class _OverviewTabState extends State<_OverviewTab> {
  bool _loading = true;
  String? _error;
  int _users = 0, _products = 0, _orders = 0, _artisans = 0;
  List<Map<String, dynamic>> _recentUsers = [];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final uRes = await ApiService.get('/user/all');
      final pRes = await ApiService.get('/market-items/all');
      final oRes = await ApiService.get('/orders/all');
      final users = (uRes['data']['users'] as List?) ?? [];
      final products = (pRes['data']['items'] as List?) ?? [];
      final orders = (oRes['data']['orders'] as List?) ?? [];
      setState(() {
        _users = users.length;
        _products = products.length;
        _orders = orders.length;
        _artisans = users.where((u) => u['type'] == 'Artisan').length;
        _recentUsers = users.reversed.take(3).map((u) => Map<String, dynamic>.from(u)).toList();
        _loading = false;
      });
    } on ApiException catch (e) {
      setState(() { _error = e.message; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppColors.gold,
      onRefresh: _load,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Header
          Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Dashboard', style: TextStyle(color: AppColors.gold, fontSize: 26, fontWeight: FontWeight.w800, fontFamily: 'Playfair')),
              const SizedBox(height: 4),
              Text('Welcome back, Admin', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
            ])),
            _headerBtn(Icons.refresh_rounded, _load),
          ]),
          const SizedBox(height: 24),

          if (_loading) const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 2)))
          else if (_error != null) _errorWidget(_error!, _load)
          else ...[
            // Stat cards — use Wrap to avoid overflow
            Wrap(spacing: 12, runSpacing: 12, children: [
              _statCard('Users', '$_users', Icons.people_rounded, AppColors.gold),
              _statCard('Products', '$_products', Icons.inventory_2_rounded, AppColors.accentOrange),
              _statCard('Orders', '$_orders', Icons.receipt_long_rounded, AppColors.success),
              _statCard('Artisans', '$_artisans', Icons.handyman_rounded, AppColors.accentBlue),
            ]),
            const SizedBox(height: 28),
            const Text('Recent Users', style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            if (_recentUsers.isEmpty) _emptyState('No users yet')
            else ..._recentUsers.map((u) => _activityTile(
              icon: Icons.person_add_rounded,
              title: '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}',
              subtitle: '${u['type'] ?? 'User'} · ${u['email'] ?? ''}',
              color: AppColors.gold,
            )),
          ],
        ]),
      ),
    );
  }

  Widget _statCard(String title, String value, IconData icon, Color color) {
    final w = (MediaQuery.of(context).size.width - 52) / 2 - 6;
    return Container(
      width: w.clamp(140.0, 250.0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(height: 12),
        Text(value, style: const TextStyle(color: AppColors.textPrimary, fontSize: 28, fontWeight: FontWeight.w800)),
        const SizedBox(height: 2),
        Text(title, style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
      ]),
    );
  }

  Widget _headerBtn(IconData icon, VoidCallback onTap) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), color: AppColors.surface, border: Border.all(color: AppColors.divider)),
        child: Icon(icon, color: AppColors.gold, size: 20),
      ),
    );
  }
}

// ─── Users Tab ────────────────────────────────────────────────────────────
class _UsersTab extends StatefulWidget {
  const _UsersTab();
  @override
  State<_UsersTab> createState() => _UsersTabState();
}

class _UsersTabState extends State<_UsersTab> {
  bool _loading = true;
  String? _error;
  List<UserModel> _users = [];
  List<UserModel> _filtered = [];
  final _searchCtrl = TextEditingController();

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await ApiService.get('/user/all');
      final list = (res['data']['users'] as List?) ?? [];
      setState(() {
        _users = list.map((j) {
          final u = UserModel.fromJson(Map<String, dynamic>.from(j));
          return u.copyWith(isBanned: _blockedUserIds.contains(u.id));
        }).toList();
        _filtered = _users;
        _loading = false;
      });
    } on ApiException catch (e) {
      setState(() { _error = e.message; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  void _search(String q) {
    if (q.isEmpty) { setState(() => _filtered = _users); return; }
    final lower = q.toLowerCase();
    setState(() => _filtered = _users.where((u) =>
      u.fullName.toLowerCase().contains(lower) ||
      u.email.toLowerCase().contains(lower) ||
      u.type.toLowerCase().contains(lower)
    ).toList());
  }

  // Local mock for blocked users
  static final Set<int> _blockedUserIds = {};

  Future<void> _toggleBan(UserModel u) async {
    final newStatus = !u.isBanned;
    
    // Locally mock the backend request
    setState(() {
      if (newStatus) {
        _blockedUserIds.add(u.id);
      } else {
        _blockedUserIds.remove(u.id);
      }
      final i = _users.indexWhere((x) => x.id == u.id);
      if (i != -1) {
        _users[i] = _users[i].copyWith(isBanned: newStatus);
        _search(_searchCtrl.text);
      }
    });
    
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${newStatus ? 'Blocked' : 'Unblocked'} ${u.fullName}')));
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppColors.gold,
      onRefresh: _load,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('User Management', style: TextStyle(color: AppColors.gold, fontSize: 24, fontWeight: FontWeight.w800, fontFamily: 'Playfair')),
              const SizedBox(height: 4),
              Text('${_users.length} registered users', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
              const SizedBox(height: 16),
              TextField(
                controller: _searchCtrl,
                onChanged: _search,
                decoration: InputDecoration(
                  hintText: 'Search users...',
                  prefixIcon: const Icon(Icons.search_rounded, size: 20),
                  suffixIcon: _searchCtrl.text.isNotEmpty ? IconButton(icon: const Icon(Icons.close, size: 18), onPressed: () { _searchCtrl.clear(); _search(''); }) : null,
                ),
              ),
              const SizedBox(height: 16),
            ]),
          )),
          if (_loading) const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 2)))
          else if (_error != null) SliverFillRemaining(child: Center(child: _errorWidget(_error!, _load)))
          else if (_filtered.isEmpty) SliverFillRemaining(child: Center(child: _emptyState('No users found')))
          else SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            sliver: SliverList.builder(
              itemCount: _filtered.length,
              itemBuilder: (_, i) => _userCard(_filtered[i]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _userCard(UserModel u) {
    final color = u.isAdmin ? AppColors.gold : u.isArtisan ? AppColors.accentOrange : AppColors.accentBlue;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: u.isBanned ? AppColors.error.withValues(alpha: 0.3) : AppColors.divider)),
      child: Row(children: [
        CircleAvatar(radius: 20, backgroundColor: color.withValues(alpha: 0.15), child: Text(u.firstName.isNotEmpty ? u.firstName[0] : 'U', style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 15))),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(u.fullName, style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(u.email, style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withValues(alpha: 0.2))),
          child: Text(u.type, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
        ),
        const SizedBox(width: 8),
        if (!u.isAdmin) // Don't allow banning admins
          IconButton(
            icon: Icon(u.isBanned ? Icons.lock_open_rounded : Icons.block_rounded, color: u.isBanned ? AppColors.success : AppColors.error, size: 20),
            tooltip: u.isBanned ? 'Unblock User' : 'Block User',
            onPressed: () => _toggleBan(u),
          ),
      ]),
    );
  }
}

// ─── Products Tab ─────────────────────────────────────────────────────────
class _ProductsTab extends StatefulWidget {
  const _ProductsTab();
  @override
  State<_ProductsTab> createState() => _ProductsTabState();
}

class _ProductsTabState extends State<_ProductsTab> {
  bool _loading = true;
  String? _error;
  List<MarketItemModel> _items = [];
  List<MarketItemModel> _filtered = [];
  final _searchCtrl = TextEditingController();

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await ApiService.get('/market-items/all');
      final list = (res['data']['items'] as List?) ?? [];
      setState(() {
        _items = list.map((j) => MarketItemModel.fromJson(Map<String, dynamic>.from(j))).toList();
        _filtered = _items;
        _loading = false;
      });
    } on ApiException catch (e) {
      setState(() { _error = e.message; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  void _search(String q) {
    if (q.isEmpty) { setState(() => _filtered = _items); return; }
    final lower = q.toLowerCase();
    setState(() => _filtered = _items.where((p) =>
      p.item.toLowerCase().contains(lower) ||
      (p.category ?? '').toLowerCase().contains(lower) ||
      (p.artisanName ?? '').toLowerCase().contains(lower)
    ).toList());
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppColors.gold,
      onRefresh: _load,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Product Moderation', style: TextStyle(color: AppColors.gold, fontSize: 24, fontWeight: FontWeight.w800, fontFamily: 'Playfair')),
              const SizedBox(height: 4),
              Text('${_items.length} listed products', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
              const SizedBox(height: 16),
              TextField(controller: _searchCtrl, onChanged: _search, decoration: InputDecoration(hintText: 'Search products...', prefixIcon: const Icon(Icons.search_rounded, size: 20), suffixIcon: _searchCtrl.text.isNotEmpty ? IconButton(icon: const Icon(Icons.close, size: 18), onPressed: () { _searchCtrl.clear(); _search(''); }) : null)),
              const SizedBox(height: 16),
            ]),
          )),
          if (_loading) const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 2)))
          else if (_error != null) SliverFillRemaining(child: Center(child: _errorWidget(_error!, _load)))
          else if (_filtered.isEmpty) SliverFillRemaining(child: Center(child: _emptyState('No products found')))
          else SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            sliver: SliverList.builder(
              itemCount: _filtered.length,
              itemBuilder: (_, i) {
                final p = _filtered[i];
                final catColor = {'Pottery': AppColors.accentOrange, 'Textiles': AppColors.accentPurple, 'Jewelry': AppColors.gold, 'Decor': AppColors.accentGreen}[p.category] ?? AppColors.accentBlue;
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.divider)),
                  child: Row(children: [
                    Container(width: 44, height: 44, decoration: BoxDecoration(color: catColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)), child: Icon(Icons.shopping_bag_rounded, color: catColor, size: 20)),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(p.item, style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 2),
                      Text('by ${p.artisanName ?? 'Unknown'} · ${p.category ?? 'N/A'}', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                    ])),
                    Text('EGP ${p.price.toStringAsFixed(0)}', style: const TextStyle(color: AppColors.gold, fontSize: 14, fontWeight: FontWeight.w700)),
                  ]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}


// ─── Analytics Tab ────────────────────────────────────────────────────────
class _AnalyticsTab extends StatefulWidget {
  const _AnalyticsTab();
  @override
  State<_AnalyticsTab> createState() => _AnalyticsTabState();
}

class _AnalyticsTabState extends State<_AnalyticsTab> {
  bool _loading = true;
  String? _error;
  int _users = 0, _products = 0, _orders = 0;
  String _topCategory = 'N/A';

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final uRes = await ApiService.get('/user/all');
      final pRes = await ApiService.get('/market-items/all');
      final oRes = await ApiService.get('/orders/all');
      final products = (pRes['data']['items'] as List?) ?? [];
      // Find top category
      final catCount = <String, int>{};
      for (final p in products) { final c = p['category'] ?? 'Other'; catCount[c] = (catCount[c] ?? 0) + 1; }
      String top = 'N/A';
      int topN = 0;
      catCount.forEach((k, v) { if (v > topN) { top = k; topN = v; } });

      setState(() {
        _users = ((uRes['data']['users'] as List?) ?? []).length;
        _products = products.length;
        _orders = ((oRes['data']['orders'] as List?) ?? []).length;
        _topCategory = top;
        _loading = false;
      });
    } on ApiException catch (e) {
      setState(() { _error = e.message; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppColors.gold,
      onRefresh: _load,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Analytics & Reports', style: TextStyle(color: AppColors.gold, fontSize: 24, fontWeight: FontWeight.w800, fontFamily: 'Playfair')),
          const SizedBox(height: 4),
          Text('Platform performance metrics', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
          const SizedBox(height: 24),
          if (_loading) const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 2)))
          else if (_error != null) _errorWidget(_error!, _load)
          else ...[
            _analyticsCard('Total Users', '$_users', Icons.people_rounded, AppColors.gold, 'All registered'),
            const SizedBox(height: 12),
            _analyticsCard('Total Products', '$_products', Icons.inventory_2_rounded, AppColors.accentOrange, 'Listed items'),
            const SizedBox(height: 12),
            _analyticsCard('Total Orders', '$_orders', Icons.receipt_long_rounded, AppColors.success, 'All orders'),
            const SizedBox(height: 12),
            _analyticsCard('Top Category', _topCategory, Icons.category_rounded, AppColors.accentPurple, 'Most products'),
            
            const SizedBox(height: 24),
            const Text('Revenue Overview', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Container(
              height: 250,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: LineChart(
                LineChartData(
                  gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (value) => FlLine(color: Theme.of(context).dividerColor, strokeWidth: 1)),
                  titlesData: FlTitlesData(
                    rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 30,
                        getTitlesWidget: (value, meta) {
                          const style = TextStyle(color: AppColors.textMuted, fontSize: 12);
                          String text;
                          switch (value.toInt()) {
                            case 0: text = 'Mon'; break;
                            case 2: text = 'Wed'; break;
                            case 4: text = 'Fri'; break;
                            case 6: text = 'Sun'; break;
                            default: return const SizedBox();
                          }
                          return Padding(padding: const EdgeInsets.only(top: 8.0), child: Text(text, style: style));
                        },
                      ),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  minX: 0,
                  maxX: 6,
                  minY: 0,
                  maxY: 6,
                  lineBarsData: [
                    LineChartBarData(
                      spots: const [FlSpot(0, 3), FlSpot(1, 1), FlSpot(2, 4), FlSpot(3, 2), FlSpot(4, 5), FlSpot(5, 3), FlSpot(6, 4)],
                      isCurved: true,
                      color: AppColors.gold,
                      barWidth: 3,
                      isStrokeCapRound: true,
                      dotData: FlDotData(show: true),
                      belowBarData: BarAreaData(show: true, color: AppColors.gold.withValues(alpha: 0.2)),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            const Text('User Growth', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Container(
              height: 220,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: BarChart(
                BarChartData(
                  gridData: FlGridData(show: false),
                  titlesData: FlTitlesData(
                    rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          const style = TextStyle(color: AppColors.textMuted, fontSize: 10);
                          return Text('Wk ${value.toInt()}', style: style);
                        },
                      ),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  barGroups: [
                    BarChartGroupData(x: 1, barRods: [BarChartRodData(toY: 8, color: AppColors.accentBlue, width: 14, borderRadius: BorderRadius.circular(4))]),
                    BarChartGroupData(x: 2, barRods: [BarChartRodData(toY: 10, color: AppColors.accentBlue, width: 14, borderRadius: BorderRadius.circular(4))]),
                    BarChartGroupData(x: 3, barRods: [BarChartRodData(toY: 14, color: AppColors.accentBlue, width: 14, borderRadius: BorderRadius.circular(4))]),
                    BarChartGroupData(x: 4, barRods: [BarChartRodData(toY: 15, color: AppColors.accentBlue, width: 14, borderRadius: BorderRadius.circular(4))]),
                  ],
                ),
              ),
            ),
          ],
        ]),
      ),
    );
  }
}

// ─── Shared helpers ───────────────────────────────────────────────────────
Widget _errorWidget(String msg, VoidCallback retry) {
  return Column(mainAxisSize: MainAxisSize.min, children: [
    Icon(Icons.cloud_off_rounded, color: AppColors.error.withValues(alpha: 0.6), size: 48),
    const SizedBox(height: 12),
    Text(msg, style: TextStyle(color: AppColors.textSecondary, fontSize: 14), textAlign: TextAlign.center),
    const SizedBox(height: 16),
    ElevatedButton.icon(onPressed: retry, icon: const Icon(Icons.refresh_rounded, size: 18), label: const Text('Retry'), style: ElevatedButton.styleFrom(minimumSize: const Size(140, 42))),
  ]);
}

Widget _emptyState(String msg) {
  return Column(mainAxisSize: MainAxisSize.min, children: [
    Icon(Icons.inbox_rounded, color: AppColors.textMuted.withValues(alpha: 0.4), size: 48),
    const SizedBox(height: 12),
    Text(msg, style: TextStyle(color: AppColors.textMuted, fontSize: 14)),
  ]);
}

Widget _activityTile({required IconData icon, required String title, required String subtitle, required Color color}) {
  return Container(
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.divider)),
    child: Row(children: [
      Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)), child: Icon(icon, color: color, size: 20)),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w600)),
        const SizedBox(height: 2),
        Text(subtitle, style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
      ])),
    ]),
  );
}

Widget _analyticsCard(String title, String value, IconData icon, Color color, String subtitle) {
  return Container(
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.divider)),
    child: Row(children: [
      Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(14)), child: Icon(icon, color: color, size: 24)),
      const SizedBox(width: 16),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(color: AppColors.textPrimary, fontSize: 22, fontWeight: FontWeight.w800)),
      ])),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(color: AppColors.surfaceLight, borderRadius: BorderRadius.circular(20)),
        child: Text(subtitle, style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
      ),
    ]),
  );
}
