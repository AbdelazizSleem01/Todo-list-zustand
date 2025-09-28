import { useEffect, useCallback } from 'react';
import { useTodoStore } from '@/app/store/useTodoStore';
import { NotificationService } from '../store/notifications';

export const useNotifications = () => {
  const { todos } = useTodoStore();

  const checkDueDates = useCallback(() => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    todos.forEach(todo => {
      if (!todo.completed && todo.dueDate) {
        const dueDate = new Date(todo.dueDate);
        
        // تنبيه إذا كانت المهمة متأخرة
        if (dueDate < now) {
          NotificationService.showOverdueTask(todo.text);
        }
        // تنبيه إذا كانت المهمة خلال الساعة القادمة
        else if (dueDate <= oneHourFromNow) {
          NotificationService.showDueDateReminder(todo.text, todo.dueDate);
        }
        // تنبيه إذا كانت المهمة خلال الـ24 ساعة القادمة
        else if (dueDate <= oneDayFromNow) {
          NotificationService.showDueDateReminder(todo.text, todo.dueDate);
        }
      }
    });
  }, [todos]);

  useEffect(() => {
    // طلب الإذن عند تحميل المكون
    NotificationService.requestPermission();

    // فحص التواريخ كل دقيقة
    const interval = setInterval(checkDueDates, 60000);
    
    // فحص فوري عند التحميل
    checkDueDates();

    return () => clearInterval(interval);
  }, [checkDueDates]);

  return { checkDueDates };
};