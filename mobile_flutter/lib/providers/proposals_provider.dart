import 'package:flutter/material.dart';

import '../core/local_storage/local_storage_service.dart';
import '../core/local_storage/storage_keys.dart';
import '../models/proposal_model.dart';

class ProposalsProvider extends ChangeNotifier {
  List<ProposalModel> _proposals = [];

  List<ProposalModel> get proposals => List.unmodifiable(_proposals);

  ProposalsProvider() {
    loadProposals();
  }

  Future<void> loadProposals() async {
    final data = LocalStorageService.loadList(StorageKeys.proposals);
    _proposals = data.map((json) => ProposalModel.fromJson(json)).toList();
    notifyListeners();
  }

  List<ProposalModel> forBuyer(int buyerId) {
    return _proposals.where((proposal) => proposal.buyerId == buyerId).toList()
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
  }

  List<ProposalModel> forArtisan(int artisanId) {
    return _proposals
        .where((proposal) => proposal.artisanId == artisanId)
        .toList()
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
  }

  Future<ProposalModel> createProposal({
    required int customOrderId,
    required int artisanId,
    required int buyerId,
    required double price,
    required String timeline,
    required String message,
  }) async {
    final proposal = ProposalModel(
      id: LocalStorageService.getNextId(StorageKeys.proposals),
      customOrderId: customOrderId,
      artisanId: artisanId,
      buyerId: buyerId,
      price: price,
      timeline: timeline,
      message: message,
      status: 'Sent',
      timestamp: DateTime.now().toIso8601String(),
    );

    final data = LocalStorageService.loadList(StorageKeys.proposals);
    data.add(proposal.toJson());
    await LocalStorageService.saveList(StorageKeys.proposals, data);
    await loadProposals();
    return proposal;
  }

  Future<void> rejectProposal(int proposalId) async {
    await _updateProposalStatus(proposalId, 'Rejected');
  }

  Future<void> acceptProposal(ProposalModel proposal) async {
    final proposals = LocalStorageService.loadList(StorageKeys.proposals);
    for (final item in proposals) {
      if (item['id'] == proposal.id) {
        item['status'] = 'Accepted';
      } else if (item['customOrderId'] == proposal.customOrderId &&
          item['buyerId'] == proposal.buyerId &&
          item['status'] == 'Sent') {
        item['status'] = 'Rejected';
      }
    }
    await LocalStorageService.saveList(StorageKeys.proposals, proposals);

    final customOrders = LocalStorageService.loadList(StorageKeys.customOrders);
    final requestIndex = customOrders
        .indexWhere((request) => request['id'] == proposal.customOrderId);
    final request = requestIndex >= 0
        ? Map<String, dynamic>.from(customOrders[requestIndex])
        : <String, dynamic>{};
    if (requestIndex >= 0) {
      customOrders[requestIndex] = {
        ...request,
        'status': 'Accepted',
        'acceptedProposalId': proposal.id,
      };
      await LocalStorageService.saveList(
          StorageKeys.customOrders, customOrders);
    }

    final orders = LocalStorageService.loadList(StorageKeys.orders);
    final alreadyCreated =
        orders.any((order) => order['proposalId'] == proposal.id);
    if (!alreadyCreated) {
      final id = LocalStorageService.getNextId(StorageKeys.orders);
      final now = DateTime.now();
      final category = request['category']?.toString() ?? 'Custom';
      orders.add({
        'id': id,
        'orderId': 'ORD-${1000 + id}',
        'proposalId': proposal.id,
        'customOrderId': proposal.customOrderId,
        'buyerId': proposal.buyerId,
        'artisanId': proposal.artisanId,
        'buyerName': request['buyerName'] ?? 'Buyer',
        'orderDate':
            '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}',
        'deliveryAddress': request['deliveryAddress'] ?? 'Cairo, Egypt',
        'status': 'Processing',
        'totalAmount': proposal.price,
        'items': [
          {
            'productId': proposal.customOrderId,
            'name': '$category custom request',
            'price': proposal.price,
            'quantity': 1,
            'artisanId': proposal.artisanId,
          }
        ],
      });
      await LocalStorageService.saveList(StorageKeys.orders, orders);
    }

    await loadProposals();
  }

  Future<void> _updateProposalStatus(int proposalId, String status) async {
    final data = LocalStorageService.loadList(StorageKeys.proposals);
    final index = data.indexWhere((proposal) => proposal['id'] == proposalId);
    if (index == -1) return;

    data[index] = {...data[index], 'status': status};
    await LocalStorageService.saveList(StorageKeys.proposals, data);
    await loadProposals();
  }
}
