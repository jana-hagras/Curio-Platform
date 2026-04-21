class UserModel {
  final int id;
  final String firstName;
  final String? middleName;
  final String lastName;
  final String email;
  final String? password;
  final String? phone;
  final String? address;
  final String type; // Buyer, Artisan, or Admin
  final String? profileImage;
  final String? joinDate;
  // Buyer
  final String? country;
  // Artisan
  final String? bio;
  final String? status;
  final bool? verified;
  final bool isBanned;

  UserModel({
    required this.id,
    required this.firstName,
    this.middleName,
    required this.lastName,
    required this.email,
    this.password,
    this.phone,
    this.address,
    required this.type,
    this.profileImage,
    this.joinDate,
    this.country,
    this.bio,
    this.status,
    this.verified,
    this.isBanned = false,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? 0,
      firstName: json['firstName'] ?? '',
      middleName: json['middleName'],
      lastName: json['lastName'] ?? '',
      email: json['email'] ?? '',
      password: json['password'],
      phone: json['phone'],
      address: json['address'],
      type: json['type'] ?? 'Buyer',
      profileImage: json['profileImage'],
      joinDate: json['joinDate'],
      country: json['country'],
      bio: json['bio'],
      status: json['status'],
      verified: json['verified'],
      isBanned: json['isBanned'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'firstName': firstName,
      'middleName': middleName,
      'lastName': lastName,
      'email': email,
      'password': password,
      'phone': phone,
      'address': address,
      'type': type,
      'profileImage': profileImage,
      'joinDate': joinDate,
      'country': country,
      'bio': bio,
      'status': status,
      'verified': verified,
      'isBanned': isBanned,
    };
  }

  UserModel copyWith({
    int? id,
    String? firstName,
    String? middleName,
    String? lastName,
    String? email,
    String? password,
    String? phone,
    String? address,
    String? type,
    String? profileImage,
    String? joinDate,
    String? country,
    String? bio,
    String? status,
    bool? verified,
    bool? isBanned,
  }) {
    return UserModel(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      middleName: middleName ?? this.middleName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      password: password ?? this.password,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      type: type ?? this.type,
      profileImage: profileImage ?? this.profileImage,
      joinDate: joinDate ?? this.joinDate,
      country: country ?? this.country,
      bio: bio ?? this.bio,
      status: status ?? this.status,
      verified: verified ?? this.verified,
      isBanned: isBanned ?? this.isBanned,
    );
  }

  String get fullName => '$firstName $lastName';
  bool get isArtisan => type == 'Artisan';
  bool get isAdmin => type == 'Admin';
  bool get isBuyer => type == 'Buyer';
}
