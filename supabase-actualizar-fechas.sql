-- Ejecuta este SQL si ya creaste la tabla antes y quieres llenar/corregir
-- las fechas programadas desde el 02/07/2026 hasta el 02/06/2027.

update public.payment_installments
set due_date = (date '2026-07-02' + ((month_number - 1) * interval '1 month'))::date
where month_number between 1 and 12;
