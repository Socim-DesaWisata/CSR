import { AlertTriangle, Info, ShieldCheck, XCircle } from 'lucide-react';
import { ReactNode } from 'react';

interface SloiReliabilityItem {
    code: string;
    question: string;
    raw_question: string;
    mean: number;
    pearson: number;
    isValid: boolean;
    validityLabel: string;
}

interface SloiReliabilityData {
    n: number;
    k: number;
    items: SloiReliabilityItem[];
    alpha: number;
    alphaStatus: string;
    insufficientData: boolean;
}

interface SLOICalculationScoresProps {
    data: SloiReliabilityData | null;
}

const reliabilityGuides = [
    {
        range: '1 > x >= 0,9',
        label: 'Reliabilitas sangat tinggi',
        description:
            'Keseluruhan kuesioner memiliki konsistensi internal yang sangat baik. Butir-butir pertanyaan dalam kuesioner SLO saling berkaitan kuat dan mengukur dimensi SLO yang sama sehingga periode pengisian kuisioner ini konsisten dalam waktu yang sangat panjang.',
        color: '#15803d',
    },
    {
        range: '0,9 > x >= 0,7',
        label: 'Reliabilitas tinggi',
        description:
            'Keseluruhan kuesioner memiliki konsistensi internal yang baik. Butir-butir pertanyaan dalam kuesioner SLO saling berkaitan dan mengukur dimensi SLO yang sama sehingga periode pengisian kuisioner ini konsisten dalam waktu yang lama.',
        color: '#16a34a',
    },
    {
        range: '0,7 > x >= 0,6',
        label: 'Reliabilitas sedang',
        description:
            'Kuesioner memiliki konsistensi internal yang cukup. Sebagian besar pertanyaan konsisten, namun mungkin ada beberapa pertanyaan yang kurang relevan atau membingungkan bagi responden dalam menilai penerimaan sosial. Kuesioner masih bisa digunakan, dan tetap konsisten.',
        color: '#ca8a04',
    },
    {
        range: '0,6 > x > 0,5',
        label: 'Reliabilitas rendah',
        description:
            'Konsistensi internal rendah. Beberapa responden dianggap menjawab secara acak atau tidak konsisten, sehingga butir-butir dalam skala tersebut tidak berjalan bersamaan. Data hasil kuesioner ini kurang bisa diandalkan untuk mengambil keputusan karena memiliki konsistensi yang rendah dan dapat berubah dalam waktu yang sangat cepat.',
        color: '#ea580c',
    },
    {
        range: '0,5 > x',
        label: 'Tidak reliabel',
        description:
            'Tidak ada korelasi antar item. Sebagian besar responden dianggap menjawab terlalu acak atau tidak konsisten. Penelitian harus diambil ulang dengan pemilihan responden yang lebih tepat atau menjelaskan kepada setiap responden agar menjawab dengan benar.',
        color: '#dc2626',
    },
];

const validityGuides = [
    {
        id: 'strong',
        range: '1 > x >= 0,75',
        label: 'Korelasi kuat',
        description:
            'Item pertanyaan memiliki kemampuan yang sangat baik dalam mengukur variabel SLO (validitas kuat). Butir pernyataan tersebut sangat mencerminkan aspek legitimacy (legitimasi), credibility (kredibilitas), atau psychological identification (identifikasi psikologis) secara akurat dan konsisten dengan skor total.',
        color: '#15803d',
    },
    {
        id: 'high',
        range: '0,75 > x >= 0,5',
        label: 'Korelasi tinggi',
        description:
            'Item pertanyaan memiliki kemampuan yang baik dalam mengukur variabel SLO (validitas tinggi). Butir pernyataan tersebut mampu mencerminkan aspek legitimacy (legitimasi), credibility (kredibilitas), atau psychological identification (identifikasi psikologis) yang menggambarkan kondisi sebenarnya.',
        color: '#16a34a',
    },
    {
        id: 'medium',
        range: '0,5 > x >= 0,25',
        label: 'Korelasi sedang',
        description:
            'Item pertanyaan cukup valid. Hubungan antara item dengan skor total cukup kuat, namun masih ada varians lain yang tidak dijelaskan oleh faktor utama. Item masih dapat digunakan untuk kuesioner, namun mungkin kurang tajam dalam membedakan persepsi responden dibandingkan item dengan korelasi tinggi.',
        color: '#ca8a04',
    },
    {
        id: 'weak',
        range: '0,25 > x > 0',
        label: 'Korelasi lemah',
        description:
            'Item pertanyaan memiliki korelasi lemah. Item ini meragukan. Seringkali item dengan korelasi rendah dianggap tidak valid (gugur) dan sebaiknya dibuang atau direvisi karena responden dianggap kurang memahami maksud dari pertanyaan ini.',
        color: '#ea580c',
    },
    {
        id: 'none',
        range: 'Negatif',
        label: 'Tidak ada korelasi',
        description:
            'Item tidak memiliki korelasi dengan skor total. Item pertanyaan tersebut dianggap gagal dalam mengukur keseluruhan skor Social License to Operate. Item ini tidak searah dengan persepsi mayoritas responden.',
        color: '#dc2626',
    },
];

function getAlphaColor(alpha: number): string {
    if (alpha >= 0.9) return '#15803d';
    if (alpha >= 0.7) return '#16a34a';
    if (alpha >= 0.6) return '#ca8a04';
    if (alpha > 0.5) return '#ea580c';
    return '#dc2626';
}

function getReliabilityGuide(pearson: number) {
    if (pearson >= 0.9) return reliabilityGuides[0];
    if (pearson >= 0.7) return reliabilityGuides[1];
    if (pearson >= 0.6) return reliabilityGuides[2];
    if (pearson > 0.5) return reliabilityGuides[3];

    return reliabilityGuides[4];
}

function getPearsonBarWidth(pearson: number): number {
    return Math.min(Math.max(pearson, 0) * 100, 100);
}

function getPearsonGuide(pearson: number) {
    if (pearson >= 0.75) return validityGuides[0];
    if (pearson >= 0.5) return validityGuides[1];
    if (pearson >= 0.25) return validityGuides[2];
    if (pearson > 0) return validityGuides[3];

    return validityGuides[4];
}

function getValidityBadgeClass(guideId: string): string {
    switch (guideId) {
        case 'strong':
            return 'bg-green-50 text-green-700';
        case 'high':
            return 'bg-emerald-50 text-emerald-700';
        case 'medium':
            return 'bg-amber-50 text-amber-700';
        case 'weak':
            return 'bg-orange-50 text-orange-700';
        default:
            return 'bg-red-50 text-red-600';
    }
}

export default function SLOICalculationScores({
    data,
}: SLOICalculationScoresProps): ReactNode {
    if (!data) {
        return (
            <div className="rounded-xl border border-slate-100 bg-white p-8 shadow-sm">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-slate-50">
                        <Info className="size-7 text-slate-300" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                        Analisis Reliabilitas & Validitas
                    </h3>
                    <p className="mt-2 max-w-sm text-sm text-slate-400">
                        Belum tersedia. Data akan ditampilkan setelah responden
                        menyelesaikan survei SLOI.
                    </p>
                </div>
            </div>
        );
    }

    if (data.insufficientData) {
        return (
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-8 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                        <AlertTriangle className="size-5 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            Data Belum Mencukupi
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Dibutuhkan minimal 2 responden dengan jawaban
                            lengkap untuk menghitung analisis reliabilitas dan
                            validitas. Saat ini:{' '}
                            <strong>{data.n} responden</strong>,{' '}
                            <strong>{data.k} pertanyaan</strong>.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const alphaColor = getAlphaColor(data.alpha);

    const reliabilityCategoryCounts = reliabilityGuides.map((guide) => {
        const count = data.items.filter(
            (item) => getReliabilityGuide(item.pearson).label === guide.label,
        ).length;

        return {
            ...guide,
            count,
        };
    });

    const renderGuides = (
        guides: Array<{
            range: string;
            label: string;
            description: string;
            color: string;
        }>,
    ): ReactNode => (
        <div className="space-y-3">
            {guides.map((guide) => (
                <div
                    key={guide.label}
                    className="rounded-lg border border-slate-100 bg-slate-50/60 p-4"
                >
                    <div className="mb-1 flex items-center gap-2">
                        <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: guide.color }}
                        />
                        <span className="font-mono text-[11px] text-slate-500">
                            {guide.range}
                        </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                        {guide.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                        {guide.description}
                    </p>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-6">
                    <h3 className="text-base font-bold text-slate-900">
                        Analisis Reliabilitas
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                        n = {data.n} responden · k = {data.k} pertanyaan
                    </p>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:divide-x lg:divide-slate-100">
                        <div className="flex min-h-80 flex-col justify-between p-6 lg:w-[32%]">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Uji Reliabilitas
                                </p>
                                <span
                                    className="mt-16 block font-black tabular-nums leading-none tracking-tight"
                                    style={{
                                        fontSize: 'clamp(2rem, 3vw, 2.75rem)',
                                        color: alphaColor,
                                    }}
                                >
                                    {data.alpha.toFixed(4)}
                                </span>
                                <span
                                    className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                                    style={{
                                        backgroundColor: `${alphaColor}12`,
                                        color: alphaColor,
                                    }}
                                >
                                    {data.alpha > 0.5 ? (
                                        <ShieldCheck className="size-3.5" />
                                    ) : (
                                        <XCircle className="size-3.5" />
                                    )}
                                    {data.alphaStatus}
                                </span>
                            </div>
                            <p className="text-[10px] leading-5 text-slate-400">
                                Nilai Cronbach Alpha dari {data.k} pertanyaan
                                terhadap {data.n} responden.
                            </p>
                        </div>

                        <div className="flex-1 border-t border-slate-100 p-6 lg:border-t-0">
                            <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Reliabilitas Item
                            </p>
                            <div className="space-y-3">
                                {reliabilityCategoryCounts.map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center gap-3"
                                    >
                                        <span
                                            className="size-2.5 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor: item.color,
                                            }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-semibold text-slate-700">
                                                {item.label}
                                            </p>
                                            <p className="font-mono text-[9px] text-slate-400">
                                                {item.range}
                                            </p>
                                        </div>
                                        <div className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${data.k > 0 ? (item.count / data.k) * 100 : 0}%`,
                                                    backgroundColor: item.color,
                                                }}
                                            />
                                        </div>
                                        <span
                                            className="w-5 text-right text-sm font-black tabular-nums"
                                            style={{
                                                color:
                                                    item.count > 0
                                                        ? item.color
                                                        : '#cbd5e1',
                                            }}
                                        >
                                            {item.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-5 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
                                Total:{' '}
                                <span className="font-semibold text-slate-500">
                                    {data.k}
                                </span>{' '}
                                pertanyaan
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                    <h4 className="text-sm font-bold text-slate-900">
                        Detail Per Pertanyaan
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-400">
                        Rerata jawaban dan kategori korelasi Pearson untuk
                        setiap pertanyaan
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="whitespace-nowrap px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Kode
                                </th>
                                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Pertanyaan
                                </th>
                                <th className="whitespace-nowrap px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Rerata
                                </th>
                                <th className="whitespace-nowrap px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Pearson (r)
                                </th>
                                <th className="whitespace-nowrap px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Korelasi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.items.map((item, idx) => {
                                const guide = getPearsonGuide(item.pearson);

                                return (
                                    <tr
                                        key={item.code}
                                        className={`transition-colors hover:bg-slate-50/50 ${
                                            idx % 2 === 0
                                                ? 'bg-white'
                                                : 'bg-slate-25'
                                        }`}
                                    >
                                        <td className="whitespace-nowrap px-6 py-3.5">
                                            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-600">
                                                {item.code}
                                            </span>
                                        </td>
                                        <td className="max-w-xs px-4 py-3.5 text-xs text-slate-600">
                                            <div
                                                className="line-clamp-2 [&>strong]:font-bold [&>strong]:text-slate-900"
                                                title={item.raw_question}
                                                dangerouslySetInnerHTML={{
                                                    __html: item.question,
                                                }}
                                            />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3.5 text-center font-mono text-xs font-semibold text-slate-700">
                                            {item.mean.toFixed(2)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3.5 text-center">
                                            <span
                                                className="font-mono text-xs font-bold"
                                                style={{
                                                    color: guide.color,
                                                }}
                                            >
                                                {item.pearson.toFixed(4)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex flex-col items-center gap-2">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getValidityBadgeClass(guide.id)}`}
                                                >
                                                    {guide.label}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-slate-200 bg-slate-50/70">
                                <td className="px-6 py-3" />
                                <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                                    Uji Reliabilitas
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500">
                                    Cronbach Alpha
                                </td>
                                <td
                                    className="px-4 py-3 text-center font-mono text-xs font-bold"
                                    style={{ color: alphaColor }}
                                >
                                    {data.alpha.toFixed(4)}
                                </td>
                                <td className="px-6 py-3 text-center">
                                    <span
                                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                                            data.alpha > 0.5
                                                ? 'bg-white text-green-700 ring-green-200'
                                                : 'bg-white text-red-600 ring-red-200'
                                        }`}
                                    >
                                        {data.alphaStatus}
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h4 className="mb-2 text-sm font-bold text-slate-900">
                        Keterangan Uji Reliabilitas
                    </h4>
                    <p className="mb-4 text-sm text-slate-500">
                        Uji reliabilitas mengukur seberapa konsisten tingkat
                        persepsi responden secara keseluruhan dalam mengukur
                        Social License to Operate.
                    </p>
                    {renderGuides(reliabilityGuides)}
                </section>

                <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h4 className="mb-2 text-sm font-bold text-slate-900">
                        Keterangan Uji Validitas
                    </h4>
                    <p className="mb-4 text-sm text-slate-500">
                        Uji Validitas : Mengukur seberapa kuat masing-masing
                        item pertanyaan dengan keseluruhan skor total Social
                        License to Operate
                    </p>
                    {renderGuides(validityGuides)}
                </section>
            </div>
        </div>
    );
}
