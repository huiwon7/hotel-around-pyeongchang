import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '호텔어라운드 평창 | 모바일 숙박권',
  description: '호텔어라운드 평창 모바일 숙박권으로 합리적인 가격에 평창의 힐링을 경험하세요. 선결제 바우처로 원하는 날짜에 자유롭게 예약하세요.',
  keywords: ['호텔어라운드', '평창', '숙박권', '바우처', '워케이션', '힐링'],
  openGraph: {
    title: '호텔어라운드 평창 | 모바일 숙박권',
    description: '선결제 바우처로 합리적인 가격에 평창 힐링 스테이',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
