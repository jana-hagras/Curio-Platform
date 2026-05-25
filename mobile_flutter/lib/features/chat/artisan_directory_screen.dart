import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/local_storage/local_storage_service.dart';
import '../../core/local_storage/storage_keys.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';

/// Contact directory that adapts to the current user's role:
/// - **Buyer** → sees artisans
/// - **Artisan** → sees buyers
/// - **Admin** → sees everyone
class ArtisanDirectoryScreen extends StatefulWidget {
  const ArtisanDirectoryScreen({super.key});

  @override
  State<ArtisanDirectoryScreen> createState() => _ArtisanDirectoryScreenState();
}

class _ArtisanDirectoryScreenState extends State<ArtisanDirectoryScreen> {
  List<Map<String, dynamic>> _contacts = [];
  List<Map<String, dynamic>> _filteredContacts = [];
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadContacts();
  }

  Future<void> _loadContacts() async {
    final users = LocalStorageService.loadList(StorageKeys.users);
    final currentUser =
        Provider.of<AuthProvider>(context, listen: false).user;
    if (currentUser == null) return;

    List<Map<String, dynamic>> contacts;
    if (currentUser.isAdmin) {
      // Admin sees everyone except themselves
      contacts = users.where((u) => u['id'] != currentUser.id).toList();
    } else if (currentUser.isArtisan) {
      // Artisan sees buyers
      contacts = users
          .where((u) => u['type'] == 'Buyer' && u['id'] != currentUser.id)
          .toList();
    } else {
      // Buyer sees artisans
      contacts = users
          .where((u) => u['type'] == 'Artisan' && u['id'] != currentUser.id)
          .toList();
    }

    setState(() {
      _contacts = contacts;
      _filteredContacts = contacts;
    });
  }

  void _filter() {
    setState(() {
      _filteredContacts = _contacts.where((contact) {
        final name =
            '${contact['firstName']} ${contact['lastName']}'.toLowerCase();
        return name.contains(_searchQuery.toLowerCase());
      }).toList();
    });
  }

  void _startChat(Map<String, dynamic> contact) {
    Navigator.pushReplacementNamed(context, '/chat', arguments: {
      'peerId': contact['id'],
      'peerName': '${contact['firstName']} ${contact['lastName']}',
    });
  }

  String get _screenTitle {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    if (user == null) return 'Directory';
    if (user.isAdmin) return 'All Users';
    if (user.isArtisan) return 'Buyer Directory';
    return 'Artisan Directory';
  }

  String get _searchHint {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    if (user == null) return 'Search...';
    if (user.isAdmin) return 'Search all users...';
    if (user.isArtisan) return 'Search buyers...';
    return 'Search artisans...';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_screenTitle),
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
                decoration: InputDecoration(
                  hintText: _searchHint,
                  prefixIcon: const Icon(Icons.search,
                      color: AppColors.textSecondary),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 12),
                ),
              ),
            ),
          ),
        ),
      ),
      body: _filteredContacts.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.people_outline,
                      size: 56, color: AppColors.textSecondary),
                  const SizedBox(height: 12),
                  const Text('No users found',
                      style: TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 16)),
                  const SizedBox(height: 4),
                  Text(
                    _searchQuery.isEmpty
                        ? 'No contacts available'
                        : 'Try a different search term',
                    style:
                        const TextStyle(color: AppColors.textSecondary),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _filteredContacts.length,
              itemBuilder: (context, index) {
                final contact = _filteredContacts[index];
                final name =
                    '${contact['firstName']} ${contact['lastName']}';
                final type = contact['type']?.toString() ?? 'User';

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(
                        color: AppColors.divider.withValues(alpha: 0.5)),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor:
                              _roleColor(type).withValues(alpha: 0.15),
                          child: Text(
                            name[0].toUpperCase(),
                            style: TextStyle(
                              color: _roleColor(type),
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
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(name,
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16)),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 7, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: _roleColor(type)
                                          .withValues(alpha: 0.1),
                                      borderRadius:
                                          BorderRadius.circular(6),
                                    ),
                                    child: Text(type,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: _roleColor(type),
                                        )),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                contact['bio'] ??
                                    contact['email']?.toString() ??
                                    '',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton(
                          onPressed: () => _startChat(contact),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            minimumSize: const Size(0, 36),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20)),
                          ),
                          child: const Text('Message',
                              style: TextStyle(fontSize: 13)),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  Color _roleColor(String type) {
    return switch (type) {
      'Artisan' => AppColors.gold,
      'Admin' => AppColors.info,
      'Buyer' => AppColors.success,
      _ => AppColors.textSecondary,
    };
  }
}
