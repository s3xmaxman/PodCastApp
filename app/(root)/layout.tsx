export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <main>
        <p className="text-white-1">LeftSideBar</p>
        {children}
        <p className="text-white-1">RightSideBar</p>
      </main>
    </div>
  );
}
