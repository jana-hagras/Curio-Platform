import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/cart_provider.dart';
import '../../providers/order_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notification_provider.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String _address = '';
  String _payment = 'Cash on Delivery';
  late TextEditingController _addressCtrl;

  @override
  void initState() {
    super.initState();
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _address = auth.user?.address ?? 'Cairo, Egypt';
    _addressCtrl = TextEditingController(text: _address);
  }

  @override
  void dispose() {
    _addressCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Delivery Address',
              style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          TextField(
            controller: _addressCtrl,
            onChanged: (v) => _address = v,
            decoration: const InputDecoration(border: OutlineInputBorder()),
          ),
          const SizedBox(height: 16),
          const Text('Payment Method',
              style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          DropdownButton<String>(
            value: _payment,
            items: const [
              DropdownMenuItem(
                  value: 'Cash on Delivery', child: Text('Cash on Delivery')),
              DropdownMenuItem(
                  value: 'Credit/Debit Card',
                  child: Text('Credit/Debit Card (mock)')),
            ],
            onChanged: (v) => setState(() => _payment = v ?? _payment),
          ),
          const SizedBox(height: 16),
          const SizedBox(height: 24),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Total', style: TextStyle(color: AppColors.textSecondary)),
              Text('\$ ${cart.total.toStringAsFixed(0)}',
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.w800)),
            ]),
            ElevatedButton(
              onPressed: () async {
                final auth = Provider.of<AuthProvider>(context, listen: false);
                final orderProv =
                    Provider.of<OrderProvider>(context, listen: false);
                final notif =
                    Provider.of<NotificationProvider>(context, listen: false);
                if (auth.user == null) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text('Please login to continue')));
                  return;
                }
                final order = await orderProv.placeOrder(
                  buyerId: auth.user!.id,
                  buyerName: auth.user!.fullName,
                  deliveryAddress: _address,
                  cartItems: cart.items,
                );

                await notif.addNotification(
                    title: 'Order Placed',
                    body: '${order.orderId} is processing',
                    icon: 'check_circle',
                    color: 'success');
                await cart.clearCart();
                if (context.mounted) {
                  Navigator.pushNamedAndRemoveUntil(
                    context, 
                    '/order-confirmation', 
                    (r) => false,
                    arguments: {'orderId': order.orderId},
                  );
                }
              },
              child: const Padding(
                  padding: EdgeInsets.all(12), child: Text('Place Order')),
            )
          ])
        ]),
      ),
    );
  }
}
