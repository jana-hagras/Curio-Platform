import 'package:flutter/material.dart';

class ArtisanScreen extends StatelessWidget {
  const ArtisanScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Artisan Dashboard')),
      body: const Center(child: Text('Artisan Placeholder')),
    );
  }
}
