// import {
//     ActivityFeed,
//     BarChart,
//     LineChart,
//     ScoreDistribution,
//     StatCard,
// } from '@/Components/Company';
// import CompanyLayout from '@/Layouts/AppLayout';
// import { Head } from '@inertiajs/react';

// // Types
// interface DashboardStats {
//     totalProjects: number;
//     activeProjects: number;
//     enumerators: number;
//     monthlyResponses: number;
//     trends: {
//         newProjectsThisMonth: number;
//         operationalRate: number;
//         enumeratorGrowth: number;
//         responseGrowth: number;
//     };
// }

// interface ProjectData {
//     name: string;
//     ikmHeight: string;
//     sloiHeight: string;
// }

// interface ActivityData {
//     icon: string;
//     iconBgColor: string;
//     iconColor: string;
//     title: string;
//     description: string;
//     time: string;
// }

// interface ScoreItem {
//     label: string;
//     value: string;
// }

// interface ScoreDistributionTypeData {
//     percentage: number;
//     percentageLabel: string;
//     totalSubmissions: number;
//     scores: ScoreItem[];
// }

// interface ScoreDistributionData {
//     ikm: ScoreDistributionTypeData;
//     sloi: ScoreDistributionTypeData;
// }

// interface Props {
//     stats: DashboardStats;
//     projects: ProjectData[];
//     scoreDistribution: ScoreDistributionData;
//     activities: ActivityData[];
//     dateLabels: string[];
// }

// const chartLegend = [
//     { label: 'IKM', color: 'bg-primary' },
//     { label: 'SLOI', color: 'bg-primary/50' },
// ];

// export default function Dashboard({
//     stats,
//     projects,
//     scoreDistribution,
//     activities,
//     dateLabels,
// }: Props) {
//     return (
//         <CompanyLayout
//             breadcrumb={{ parent: 'Dashboard', current: 'Perusahaan' }}
//         >
//             <Head title="Dashboard" />

//             <div className="space-y-8 p-8">
//                 {/* Grid Statistik */}
//                 <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
//                     <StatCard
//                         icon="folder"
//                         iconBgColor="bg-blue-50"
//                         iconColor="text-blue-600"
//                         label="Total Proyek"
//                         badge="TOTAL"
//                         value={stats.totalProjects}
//                         trend={{
//                             text: `+${stats.trends.newProjectsThisMonth} bulan ini`,
//                             isPositive: stats.trends.newProjectsThisMonth > 0,
//                         }}
//                     />
//                     <StatCard
//                         icon="play_circle"
//                         iconBgColor="bg-green-50"
//                         iconColor="text-primary"
//                         label="Proyek Aktif"
//                         badge="AKTIF"
//                         value={stats.activeProjects}
//                         trend={{
//                             text: `${stats.trends.operationalRate}% tingkat operasional`,
//                             isPositive: stats.trends.operationalRate >= 50,
//                         }}
//                     />
//                     <StatCard
//                         icon="badge"
//                         iconBgColor="bg-purple-50"
//                         iconColor="text-purple-600"
//                         label="Enumerator"
//                         badge="STAF"
//                         value={stats.enumerators}
//                         trend={{
//                             text: `${stats.trends.enumeratorGrowth >= 0 ? '+' : ''}${stats.trends.enumeratorGrowth}% dari tahun lalu`,
//                             isPositive: stats.trends.enumeratorGrowth > 0,
//                         }}
//                     />
//                     <StatCard
//                         icon="forum"
//                         iconBgColor="bg-orange-50"
//                         iconColor="text-orange-600"
//                         label="Respons Bulanan"
//                         badge="AKTIVITAS"
//                         value={stats.monthlyResponses.toLocaleString()}
//                         trend={{
//                             text: `${stats.trends.responseGrowth >= 0 ? '+' : ''}${stats.trends.responseGrowth}% keterlibatan`,
//                             isPositive: stats.trends.responseGrowth > 0,
//                         }}
//                     />
//                 </section>

//                 {/* Baris Grafik Utama */}
//                 <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
//                     <BarChart
//                         title="Ringkasan Performa Proyek"
//                         legend={chartLegend}
//                         projects={projects}
//                     />
//                     <ScoreDistribution
//                         title="Distribusi Skor"
//                         ikm={scoreDistribution.ikm}
//                         sloi={scoreDistribution.sloi}
//                     />
//                 </section>

//                 {/* Baris Bawah */}
//                 <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
//                     <LineChart
//                         title="Tren Respons"
//                         description="Volume pengiriman selama 30 hari terakhir."
//                         dateLabels={dateLabels}
//                         trendData={[]}
//                         projectList={[]}
//                         selectedProjectId={null}
//                     />
//                     <ActivityFeed
//                         title="Aktivitas Terbaru"
//                         activities={activities}
//                         viewAllLink="/activities"
//                     />
//                 </section>
//             </div>
//         </CompanyLayout>
//     );
// }
