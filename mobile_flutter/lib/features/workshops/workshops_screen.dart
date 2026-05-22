import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/local_storage/local_storage_service.dart';
import '../../core/local_storage/storage_keys.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../shared/widgets/custom_image.dart';
import '../../shared/widgets/app_drawer.dart';

class WorkshopsScreen extends StatefulWidget {
  const WorkshopsScreen({super.key});

  @override
  State<WorkshopsScreen> createState() => _WorkshopsScreenState();
}

class _WorkshopsScreenState extends State<WorkshopsScreen> {
  List<Map<String, dynamic>> _workshops = [];
  List<Map<String, dynamic>> _mentorships = [];
  List<Map<String, dynamic>> _enrollments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);

    final workshops = LocalStorageService.loadList(StorageKeys.workshops);
    final mentorships = LocalStorageService.loadList(StorageKeys.mentorships);
    final enrollments =
        LocalStorageService.loadList(StorageKeys.programEnrollments);

    if (!mounted) return;
    setState(() {
      _workshops = workshops;
      _mentorships = mentorships;
      _enrollments = enrollments;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final isArtisan = user?.isArtisan ?? false;

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        drawer: const AppDrawer(),
        backgroundColor: const Color(0xFFF9FAFB),
        appBar: AppBar(
          title: Text(isArtisan ? 'Teach & Mentor' : 'Learn from Artisans'),
          actions: [
            if (isArtisan)
              IconButton(
                tooltip: 'Create session',
                onPressed: () => _openCreateSheet(context),
                icon: const Icon(Icons.add_circle_outline),
              ),
          ],
          bottom: const TabBar(
            indicatorColor: AppColors.gold,
            labelColor: AppColors.gold,
            unselectedLabelColor: AppColors.textSecondary,
            tabs: [
              Tab(text: 'Workshops'),
              Tab(text: 'Mentorship'),
            ],
          ),
        ),
        floatingActionButton: isArtisan
            ? FloatingActionButton.extended(
                onPressed: () => _openCreateSheet(context),
                icon: const Icon(Icons.add),
                label: const Text('Create'),
              )
            : null,
        body: _loading
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.gold),
              )
            : RefreshIndicator(
                onRefresh: _load,
                color: AppColors.gold,
                child: TabBarView(
                  children: [
                    _ProgramList(
                      items: _visibleItems(
                        _workshops,
                        isArtisan: isArtisan,
                        artisanId: user?.id,
                      ),
                      type: 'Workshop',
                      isArtisan: isArtisan,
                      enrollments: _enrollments,
                      onOpen: (item) => _openDetails(context, item, 'Workshop'),
                    ),
                    _ProgramList(
                      items: _visibleItems(
                        _mentorships,
                        isArtisan: isArtisan,
                        artisanId: user?.id,
                      ),
                      type: 'Mentorship',
                      isArtisan: isArtisan,
                      enrollments: _enrollments,
                      onOpen: (item) =>
                          _openDetails(context, item, 'Mentorship'),
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  List<Map<String, dynamic>> _visibleItems(
    List<Map<String, dynamic>> source, {
    required bool isArtisan,
    required int? artisanId,
  }) {
    if (isArtisan) {
      return source.where((item) => item['artisanId'] == artisanId).toList();
    }

    return source
        .where(
            (item) => (item['status']?.toString() ?? 'Approved') == 'Approved')
        .toList();
  }

  void _openDetails(
      BuildContext context, Map<String, dynamic> item, String type) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _ProgramDetailsScreen(
          item: item,
          type: type,
          isEnrolled: _isEnrolled(item, type),
          onEnroll: () => _enroll(context, item, type),
        ),
      ),
    );
  }

  bool _isEnrolled(Map<String, dynamic> item, String type) {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    if (user == null) return false;
    return _enrollments.any((enrollment) =>
        enrollment['buyerId'] == user.id &&
        enrollment['programId'] == item['id'] &&
        enrollment['type'] == type);
  }

  Future<void> _enroll(
    BuildContext context,
    Map<String, dynamic> item,
    String type,
  ) async {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login first')),
      );
      return;
    }

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      builder: (_) => _PaymentSheet(item: item, type: type),
    );
    if (confirmed != true) return;

    final enrollments =
        LocalStorageService.loadList(StorageKeys.programEnrollments);
    final exists = enrollments.any((enrollment) =>
        enrollment['buyerId'] == user.id &&
        enrollment['programId'] == item['id'] &&
        enrollment['type'] == type);
    if (!exists) {
      enrollments.add({
        'id': LocalStorageService.getNextId(StorageKeys.programEnrollments),
        'buyerId': user.id,
        'buyerName': user.fullName,
        'programId': item['id'],
        'artisanId': item['artisanId'],
        'type': type,
        'title': item['title'],
        'price': _price(item),
        'status': 'Paid',
        'createdAt': DateTime.now().toIso8601String(),
      });
      await LocalStorageService.saveList(
          StorageKeys.programEnrollments, enrollments);
    }

    await _load();
    if (!context.mounted) return;
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('You are enrolled in ${item['title']}'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  Future<void> _openCreateSheet(BuildContext context) async {
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => Padding(
        padding:
            EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: const _CreateProgramSheet(),
      ),
    );
    if (created == true) await _load();
  }
}

class _ProgramList extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  final String type;
  final bool isArtisan;
  final List<Map<String, dynamic>> enrollments;
  final ValueChanged<Map<String, dynamic>> onOpen;

  const _ProgramList({
    required this.items,
    required this.type,
    required this.isArtisan,
    required this.enrollments,
    required this.onOpen,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return ListView(
        children: [
          SizedBox(height: MediaQuery.of(context).size.height * 0.25),
          Icon(isArtisan ? Icons.school_outlined : Icons.event_busy,
              size: 56, color: AppColors.textMuted),
          const SizedBox(height: 12),
          Center(
            child: Text(
              isArtisan
                  ? 'Create your first ${type.toLowerCase()}'
                  : 'No ${type.toLowerCase()}s available yet',
              style: const TextStyle(
                  color: AppColors.textSecondary, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        _HeroBanner(type: type),
        const SizedBox(height: 18),
        Row(
          children: [
            Expanded(
              child: Text(
                isArtisan ? 'Your $type Sessions' : 'Top $type Sessions',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
            ),
            const Icon(Icons.tune, size: 18),
            const SizedBox(width: 4),
            const Text('Filter'),
          ],
        ),
        const SizedBox(height: 12),
        ...items.map(
          (item) => Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: _ProgramCard(
              item: item,
              type: type,
              isArtisan: isArtisan,
              enrolledCount: _countEnrollments(item),
              onTap: () => onOpen(item),
            ),
          ),
        ),
      ],
    );
  }

  int _countEnrollments(Map<String, dynamic> item) {
    return enrollments
        .where((enrollment) =>
            enrollment['programId'] == item['id'] && enrollment['type'] == type)
        .length;
  }
}

class _HeroBanner extends StatelessWidget {
  final String type;

  const _HeroBanner({required this.type});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.dark, AppColors.textPrimary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 16,
            offset: const Offset(0, 8),
          )
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              type == 'Workshop'
                  ? 'Hands-on workshops from local makers'
                  : 'Mentorship with experienced artisans',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white),
            ),
          ),
          const Icon(Icons.school, size: 64, color: AppColors.gold),
        ],
      ),
    );
  }
}

class _ProgramCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final String type;
  final bool isArtisan;
  final int enrolledCount;
  final VoidCallback onTap;

  const _ProgramCard({
    required this.item,
    required this.type,
    required this.isArtisan,
    required this.enrolledCount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border:
              Border.all(color: AppColors.textPrimary.withValues(alpha: 0.15)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 92,
                height: 92,
                child: CustomImage(
                  imageUrl: item['image']?.toString(),
                  fit: BoxFit.cover,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.gold,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      item['level']?.toString() ?? type,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w800),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    item['title']?.toString() ?? type,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item['description']?.toString() ?? '',
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12, height: 1.25),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          isArtisan
                              ? '$enrolledCount enrolled'
                              : '\$ ${_price(item).toStringAsFixed(0)} EGP',
                          style: const TextStyle(
                              color: AppColors.textSecondary, fontSize: 12),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          color: AppColors.dark,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          isArtisan ? 'View' : 'Join us now!',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w800),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProgramDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> item;
  final String type;
  final bool isEnrolled;
  final Future<void> Function() onEnroll;

  const _ProgramDetailsScreen({
    required this.item,
    required this.type,
    required this.isEnrolled,
    required this.onEnroll,
  });

  @override
  Widget build(BuildContext context) {
    final isArtisan = context.watch<AuthProvider>().user?.isArtisan ?? false;

    return Scaffold(
      backgroundColor: const Color(0xFFFFF0F0),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 240,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(item['title']?.toString() ?? type),
              background: CustomImage(
                imageUrl: item['image']?.toString(),
                fit: BoxFit.cover,
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(24),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                Text(
                  '${item['title'] ?? type}\nCourse Description:',
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.w900, height: 1.2),
                ),
                const SizedBox(height: 10),
                Text(
                  item['description']?.toString() ?? '',
                  style: const TextStyle(fontSize: 16, height: 1.25),
                ),
                const SizedBox(height: 20),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _InfoPill(
                        icon: Icons.schedule,
                        label: item['duration']?.toString() ?? 'Flexible'),
                    _InfoPill(
                        icon: Icons.person,
                        label: item['mentor']?.toString() ?? 'Artisan'),
                    _InfoPill(
                        icon: Icons.payments,
                        label: '\$ ${_price(item).toStringAsFixed(0)} EGP'),
                  ],
                ),
                const SizedBox(height: 28),
                if (!isArtisan)
                  SizedBox(
                    height: 54,
                    child: ElevatedButton(
                      onPressed: isEnrolled ? null : onEnroll,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.gold,
                        foregroundColor: Colors.white,
                      ),
                      child:
                          Text(isEnrolled ? 'Already enrolled' : 'Enroll now'),
                    ),
                  )
                else
                  const Text(
                    'Buyers can enroll and pay from this page.',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _CreateProgramSheet extends StatefulWidget {
  const _CreateProgramSheet();

  @override
  State<_CreateProgramSheet> createState() => _CreateProgramSheetState();
}

class _CreateProgramSheetState extends State<_CreateProgramSheet> {
  String _type = 'Workshop';
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _durationCtrl = TextEditingController(text: '2 hours');
  final _priceCtrl = TextEditingController(text: '500');
  final _imageCtrl = TextEditingController(
    text:
        'https://images.unsplash.com/photo-1517581177682-a085bb7ffb38?w=1200&q=80',
  );

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _durationCtrl.dispose();
    _priceCtrl.dispose();
    _imageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Create learning session',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
          const SizedBox(height: 16),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'Workshop', label: Text('Workshop')),
              ButtonSegment(value: 'Mentorship', label: Text('Mentorship')),
            ],
            selected: {_type},
            onSelectionChanged: (value) => setState(() => _type = value.first),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _titleCtrl,
            decoration: const InputDecoration(labelText: 'Title'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _descCtrl,
            maxLines: 4,
            decoration: const InputDecoration(labelText: 'Description'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _durationCtrl,
            decoration: const InputDecoration(labelText: 'Duration'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _priceCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Price (EGP)'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _imageCtrl,
            decoration: const InputDecoration(labelText: 'Image URL'),
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _save,
              icon: const Icon(Icons.publish),
              label: const Text('Publish'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _save() async {
    if (_titleCtrl.text.trim().isEmpty || _descCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add a title and description')),
      );
      return;
    }

    final user = Provider.of<AuthProvider>(context, listen: false).user;
    final key =
        _type == 'Workshop' ? StorageKeys.workshops : StorageKeys.mentorships;
    final items = LocalStorageService.loadList(key);
    items.add({
      'id': LocalStorageService.getNextId(key),
      'title': _titleCtrl.text.trim(),
      'description': _descCtrl.text.trim(),
      'image': _imageCtrl.text.trim(),
      'duration': _durationCtrl.text.trim(),
      'mentor': user?.fullName ?? 'Artisan',
      'artisanId': user?.id,
      'price': double.tryParse(_priceCtrl.text.trim()) ?? 0,
      'level': _type == 'Workshop' ? 'Beginner friendly' : '1-on-1',
      'status': 'Approved',
    });
    await LocalStorageService.saveList(key, items);

    if (!mounted) return;
    Navigator.pop(context, true);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$_type published'),
        backgroundColor: AppColors.success,
      ),
    );
  }
}

class _PaymentSheet extends StatelessWidget {
  final Map<String, dynamic> item;
  final String type;

  const _PaymentSheet({required this.item, required this.type});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Enroll in $type',
              style:
                  const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
          const SizedBox(height: 8),
          Text(item['title']?.toString() ?? type),
          const SizedBox(height: 16),
          _InfoPill(
              icon: Icons.lock_outline,
              label:
                  'Mock secure payment · \$ ${_price(item).toStringAsFixed(0)} EGP'),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => Navigator.pop(context, true),
              icon: const Icon(Icons.payments_outlined),
              label: const Text('Pay and enroll'),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoPill extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoPill({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.gold),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

double _price(Map<String, dynamic> item) {
  final raw = item['price'] ?? item['fee'] ?? 500;
  if (raw is num) return raw.toDouble();
  return double.tryParse(raw.toString()) ?? 500;
}
