import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Hakkımızda & İletişim | ER YILDIZ YAZILIM",
	description: "Er Yıldız Yazılım hakkında bilgi edinin ve bizimle iletişime geçin.",
};

export default function HakkimizdaPage() {
	return (
		<main className="min-h-screen pt-24 pb-16 md:pt-32">
			<div className="mx-auto max-w-4xl px-6 md:px-10">
				<h1 className="mb-8 font-heading text-4xl font-bold tracking-tight text-white md:text-5xl">
					Hakkımızda & İletişim
				</h1>

				<div className="grid gap-12 md:grid-cols-2">
					{/* Sol Kolon: Hakkımızda */}
					<div className="space-y-6 text-lg leading-relaxed text-white/80">
						<p>
							<strong>ER YILDIZ YAZILIM</strong> olarak, işinizi dijital dünyaya taşımanıza ve büyütmenize yardımcı olacak modern, hızlı ve yenilikçi yazılım çözümleri sunuyoruz.
						</p>
						<p>
							Müşteri memnuniyetini her zaman ön planda tutarak, ihtiyaçlarınıza en uygun web ve mobil projelerini geliştiriyoruz. Profesyonel, güncel ve kullanımı kolay arayüzlerle dijital varlığınızı güçlendiriyoruz.
						</p>
						<p>
							Size nasıl yardımcı olabileceğimizi öğrenmek veya projeleriniz için fiyat teklifi almak üzere bizimle aşağıdaki iletişim kanallarından bağlantı kurabilirsiniz.
						</p>
					</div>

					{/* Sağ Kolon: İletişim Bilgileri */}
					<div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
						<h2 className="mb-6 font-heading text-2xl font-bold text-white">İletişim Bilgileri</h2>

						<ul className="space-y-6 text-white/90">
							<li className="flex items-start gap-4">
								<div className="mt-1 rounded-full bg-blue-500/20 p-2 text-blue-400">
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<rect width="20" height="16" x="2" y="4" rx="2" />
										<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
									</svg>
								</div>
								<div>
									<p className="text-sm font-medium text-white/50">E-Posta</p>
									<a href="mailto:erdogan.yildiz@eryildizyazilim.com" className="hover:text-blue-400 transition-colors">
										erdogan.yildiz@eryildizyazilim.com
									</a>
								</div>
							</li>

							<li className="flex items-start gap-4">
								<div className="mt-1 rounded-full bg-green-500/20 p-2 text-green-400">
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
									</svg>
								</div>
								<div>
									<p className="text-sm font-medium text-white/50">Telefon (GSM)</p>
									<a href="tel:+905383321973" className="hover:text-green-400 transition-colors">
										+90 538 332 19 73
									</a>
								</div>
							</li>

							<li className="flex items-start gap-4">
								<div className="mt-1 rounded-full bg-purple-500/20 p-2 text-purple-400">
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<circle cx="12" cy="12" r="10" />
										<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
										<path d="M2 12h20" />
									</svg>
								</div>
								<div>
									<p className="text-sm font-medium text-white/50">Web Sitesi</p>
									<a href="https://www.eryildizyazilim.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
										www.eryildizyazilim.com
									</a>
								</div>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</main>
	);
}
