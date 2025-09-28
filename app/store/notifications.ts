export class NotificationService {
  static async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  static showNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icon.png',
        badge: '/icon.png',
        ...options
      });
    }
  }

  static showDueDateReminder(todoText: string, dueDate: string) {
    this.showNotification('Task Due Soon!', {
      body: `"${todoText}" is due on ${new Date(dueDate).toLocaleDateString()}`,
      tag: 'due-date-reminder'
    });
  }

  static showOverdueTask(todoText: string) {
    this.showNotification('Task Overdue!', {
      body: `"${todoText}" is overdue!`,
      tag: 'overdue-task'
    });
  }
}