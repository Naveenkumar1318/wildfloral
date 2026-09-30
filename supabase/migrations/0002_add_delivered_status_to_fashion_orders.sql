-- =========================================================
-- UPDATE FASHION ORDERS STATUS CHECK CONSTRAINT
-- =========================================================
-- Allows 'delivered' as a valid status in fashion_orders table.

alter table public.fashion_orders
drop constraint if exists fashion_orders_status_check;

alter table public.fashion_orders
add constraint fashion_orders_status_check
check (
  status in (
    'pending',
    'confirmed',
    'processing',
    'ready',
    'delivered',
    'completed',
    'cancelled'
  )
);
