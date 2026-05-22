import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/local_storage/local_storage_service.dart';
import '../../core/local_storage/storage_keys.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';

class ArtisanDirectoryScreen extends StatefulWidget {
  const ArtisanDirectoryScreen({super.key});

  @override
  State<ArtisanDirectoryScreen> createState() => _ArtisanDirectoryScreenState();
}

class _ArtisanDirectoryScreenState extends State<ArtisanDirectoryScreen> {
  List<Map<String, dynamic>> _artisans = [];
  List<Map<String, dynamic>> _filteredArtisans = [];
  String _searchQuery = '';
  final String _selectedCategory = 'All';

  @override
  void initState() {
    super.initState();
    _loadArtisans();
  }

  Future<void> _loadArtisans() async {
    final users = LocalStorageService.loadList(StorageKeys.users);
    final currentUserId = Provider.of<AuthProvider>(context, listen: false).user?.id;
    
    // Filter to only artisans, excluding the current user if they are an artisan
    final artisans = users.where((u) => u['type'] == 'Artisan' && u['id'] != currentUserId).toList();
    
    setState(() {
      _artisans = artisans;
      _filteredArtisans = artisans;
    });
  }

  void _filter() {
    setState(() {
      _filteredArtisans = _artisans.where((artisan) {
        final matchesSearch = '${artisan['firstName']} ${artisan['lastName']}'.toLowerCase().contains(_searchQuery.toLowerCase());
        final matchesCategory = _selectedCategory == 'All' || (artisan['category'] == _selectedCategory);
        return matchesSearch && matchesCategory;
      }).toList();
    });
  }

  void _startChat(Map<String, dynamic> artisan) {
    Navigator.pushReplacementNamed(
      context, 
      '/chat', 
      arguments: {
        'peerId': artisan['id'],
        'peerName': '${artisan['firstName']} ${artisan['lastName']}'
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Artisan Directory'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(70),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Container(
              height: 48,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.divider),
              ),
              child: TextField(
                onChanged: (val) {
                  _searchQuery = val;
                  _filter();
                },
                decoration: const InputDecoration(
                  hintText: 'Search artisans...',
                  prefixIcon: Icon(Icons.search, color: AppColors.textSecondary),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
              ),
            ),
          ),
        ),
      ),
      body: _filteredArtisans.isEmpty
          ? const Center(child: Text("No artisans found.", style: TextStyle(color: AppColors.textSecondary)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _filteredArtisans.length,
              itemBuilder: (context, index) {
                final artisan = _filteredArtisans[index];
                final name = '${artisan['firstName']} ${artisan['lastName']}';
                
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: AppColors.divider.withValues(alpha: 0.5)),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: AppColors.gold.withValues(alpha: 0.15),
                          child: Text(
                            name[0].toUpperCase(),
                            style: const TextStyle(
                              color: AppColors.gold,
                              fontWeight: FontWeight.bold,
                              fontSize: 22,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                artisan['bio'] ?? 'Master Artisan',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton(
                          onPressed: () => _startChat(artisan),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            minimumSize: const Size(0, 36),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                          child: const Text('Message', style: TextStyle(fontSize: 13)),
                        )
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
