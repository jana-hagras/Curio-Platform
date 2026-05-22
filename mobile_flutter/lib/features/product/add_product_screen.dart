import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/api/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/market_provider.dart';
import '../../core/constants/categories.dart';

class AddProductScreen extends StatefulWidget {
  const AddProductScreen({super.key});

  @override
  State<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends State<AddProductScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();
  final _qtyController = TextEditingController();
  final _imageUrlController = TextEditingController();
  String? _pickedImagePath;

  String _selectedCategory = productCategories[0];
  bool _loading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _priceController.dispose();
    _qtyController.dispose();
    _imageUrlController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked =
        await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked == null) return;

    setState(() {
      _pickedImagePath = picked.path;
      _imageUrlController.clear();
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    try {
      final user = Provider.of<AuthProvider>(context, listen: false).user;
      if (user == null) throw Exception("Login required");

      final payload = {
        'artisan_id': user.id,
        'item': _nameController.text,
        'description': _descController.text,
        'price': double.parse(_priceController.text),
        'availQuantity': int.parse(_qtyController.text),
        'category': _selectedCategory,
        'image': _pickedImagePath ?? _imageUrlController.text.trim(),
        'images':
            (_pickedImagePath ?? _imageUrlController.text.trim()).isNotEmpty
                ? [_pickedImagePath ?? _imageUrlController.text.trim()]
                : [],
      };

      final res = await ApiService.post('/market-items/', body: payload);

      if (res['ok'] == true) {
        if (mounted) {
          Provider.of<MarketProvider>(context, listen: false).fetchItems();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text("Product listed successfully!"),
                backgroundColor: AppColors.success),
          );
          Navigator.pop(context);
        }
      } else {
        throw Exception(res['message'] ?? "Failed to list product");
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(e.toString()), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("List New Product",
            style: TextStyle(fontFamily: 'Playfair')),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _label("Product Name *"),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                    hintText: "e.g. Hand-painted Ceramic Vase"),
                validator: (v) => v == null || v.isEmpty ? "Required" : null,
              ),
              const SizedBox(height: 20),
              _label("Category *"),
              DropdownButtonFormField<String>(
                initialValue: _selectedCategory,
                items: productCategories
                    .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                    .toList(),
                onChanged: (v) => setState(() => _selectedCategory = v!),
                decoration: const InputDecoration(),
              ),
              const SizedBox(height: 20),
              _label("Description *"),
              TextFormField(
                controller: _descController,
                maxLines: 3,
                decoration:
                    const InputDecoration(hintText: "Describe your craft..."),
                validator: (v) => v == null || v.isEmpty ? "Required" : null,
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label("Price (USD) *"),
                        TextFormField(
                          controller: _priceController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(hintText: "0.00"),
                          validator: (v) =>
                              v == null || v.isEmpty ? "Required" : null,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label("Quantity *"),
                        TextFormField(
                          controller: _qtyController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(hintText: "1"),
                          validator: (v) =>
                              v == null || v.isEmpty ? "Required" : null,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _label("Product Image"),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _pickImage,
                      icon: const Icon(Icons.photo_library_outlined),
                      label: const Text('Pick from Gallery'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _imageUrlController,
                      decoration:
                          const InputDecoration(hintText: "Paste image URL"),
                      onChanged: (value) {
                        if (value.isNotEmpty) {
                          setState(() => _pickedImagePath = null);
                        }
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (_pickedImagePath != null ||
                  _imageUrlController.text.trim().isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: SizedBox(
                    height: 160,
                    width: double.infinity,
                    child: _pickedImagePath != null
                        ? Image.file(File(_pickedImagePath!), fit: BoxFit.cover)
                        : Image.network(_imageUrlController.text.trim(),
                            fit: BoxFit.cover),
                  ),
                ),
              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const CircularProgressIndicator(color: Colors.black)
                      : const Text("List Product"),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text,
          style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: AppColors.textSecondary)),
    );
  }
}
