class NotificationModel {
  final String id;
  final String title;
  final String body;
  final String icon;
  final String color;
  final String time;
  bool isRead;

  NotificationModel({
    required this.id,
    required this.title,
    required this.body,
    required this.icon,
    required this.color,
    required this.time,
    this.isRead = false,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? '',
      body: json['body'] ?? '',
      icon: json['icon'] ?? 'notifications',
      color: json['color'] ?? 'primary',
      time: json['time'] ?? '',
      isRead: json['isRead'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'body': body,
      'icon': icon,
      'color': color,
      'time': time,
      'isRead': isRead,
    };
  }
}
