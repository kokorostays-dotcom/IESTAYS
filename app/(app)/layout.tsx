/** Booking and stay screens share one phone-width column on every device. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[430px] bg-paper">{children}</div>
  );
}
