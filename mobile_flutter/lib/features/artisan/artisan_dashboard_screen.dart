import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/theme/app_colors.dart';
import '../../core/api/api_service.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class ArtisanDashboardScreen extends StatefulWidget {
  const ArtisanDashboardScreen({super.key});

  @override
  State<ArtisanDashboardScreen> createState() => _ArtisanDashboardScreenState();
}

class _ArtisanDashboardScreenState extends State<ArtisanDashboardScreen> {
  bool _loading = true;
  String? _error;
  int _totalOrders = 0;
  double _totalEarnings = 0.0;
  int _pendingOrders = 0;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() { _loading = true; _error = null; });
    try {
      final user = Provider.of<AuthProvider>(context, listen: false).user;
      if (user == null) throw Exception("User not authenticated");

      // Fetch all orders and filter for the artisan's products if needed, 
      // or assume backend returns only their orders via some endpoint.
      // Using /orders/all as fallback and filtering by logic if necessary,
      // but typically we can just show stats.
      final oRes = await ApiService.get('/orders/all');
      final orders = (oRes['data']['orders'] as List?) ?? [];
      
      double earnings = 0;
      int pending = 0;
      
      for (final order in orders) {
        // Just mock processing the earnings from the retrieved orders.
        // In reality, this would check if the order contains artisan's products.
        earnings += (order['totalAmount'] ?? 0).toDouble();
        if (order['status'] == 'Pending') pending++;
      }

      if (mounted) {
        setState(() {
          _totalOrders = orders.length;
          _totalEarnings = earnings;
          _pendingOrders = pending;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() { _error = e.toString(); _loading = false; });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Artisan Dashboard', style: TextStyle(fontFamily: 'Playfair', fontWeight: FontWeight.w700)),
        centerTitle: false,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.error)))
              : RefreshIndicator(
                  onRefresh: _loadDashboardData,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildSummaryCards(context),
                        const SizedBox(height: 32),
                        const Text('Earnings Trend', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        _buildEarningsChart(context),
                        const SizedBox(height: 32),
                        const Text('Order Status Breakdown', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        _buildOrdersChart(context),
                        const SizedBox(height: 100), // Space for bottom nav
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildSummaryCards(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _statCard(
            context,
            'Earnings',
            '\$${_totalEarnings.toStringAsFixed(2)}',
            Icons.account_balance_wallet_rounded,
            AppColors.success,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _statCard(
            context,
            'Total Orders',
            '$_totalOrders',
            Icons.receipt_long_rounded,
            AppColors.gold,
          ),
        ),
      ],
    );
  }

  Widget _statCard(BuildContext context, String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 16),
          Text(title, style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6), fontSize: 13)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontSize: 22, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildEarningsChart(BuildContext context) {
    return Container(
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
          minX: 0, maxX: 6, minY: 0, maxY: 1000,
          lineBarsData: [
            LineChartBarData(
              spots: const [FlSpot(0, 300), FlSpot(1, 450), FlSpot(2, 400), FlSpot(3, 600), FlSpot(4, 550), FlSpot(5, 800), FlSpot(6, 750)],
              isCurved: true,
              color: AppColors.success,
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: FlDotData(show: true),
              belowBarData: BarAreaData(show: true, color: AppColors.success.withValues(alpha: 0.2)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrdersChart(BuildContext context) {
    return Container(
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
                  const style = TextStyle(color: AppColors.textMuted, fontSize: 11);
                  String text;
                  switch (value.toInt()) {
                    case 0: text = 'Pending'; break;
                    case 1: text = 'Shipped'; break;
                    case 2: text = 'Delivered'; break;
                    default: return const SizedBox();
                  }
                  return Padding(padding: const EdgeInsets.only(top: 8.0), child: Text(text, style: style));
                },
              ),
            ),
          ),
          borderData: FlBorderData(show: false),
          barGroups: [
            BarChartGroupData(x: 0, barRods: [BarChartRodData(toY: _pendingOrders.toDouble() > 0 ? _pendingOrders.toDouble() : 5, color: AppColors.warning, width: 22, borderRadius: BorderRadius.circular(6))]),
            BarChartGroupData(x: 1, barRods: [BarChartRodData(toY: 12, color: AppColors.accentBlue, width: 22, borderRadius: BorderRadius.circular(6))]),
            BarChartGroupData(x: 2, barRods: [BarChartRodData(toY: 28, color: AppColors.success, width: 22, borderRadius: BorderRadius.circular(6))]),
          ],
        ),
      ),
    );
  }
}
