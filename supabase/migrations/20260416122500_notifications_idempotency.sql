ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS procedure_id UUID REFERENCES public.procedures(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS reminder_day INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_procedure_reminder_idx
ON public.notifications (user_id, procedure_id, reminder_day);
