import EnumeratorLayout from '@/Layouts/EnumeratorLayout';
import { Head, Link } from '@inertiajs/react';
import { IWorkbookData, LocaleType, UniverInstanceType } from '@univerjs/core';
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
import '@univerjs/preset-sheets-core/lib/index.css';
import UniverSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US';
import { createUniver } from '@univerjs/presets';
import '@univerjs/sheets/lib/facade';
import { useEffect, useRef, useState } from 'react';

interface DataSroiProps {
    project: {
        id: number | string;
        name: string;
        projectCode: string;
        enable_sroi: boolean;
    };
}

const dataSroiColumnWidths = [
    120, 60, 140, 120, 70, 180, 120, 110, 140, 180, 120, 120, 180, 180, 180,
    180, 120, 200, 170, 120, 170, 140, 140, 200, 180, 120,
];

export default function DataSroi({ project }: DataSroiProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let isActive = true;
        let dispose: (() => void) | undefined;

        const loadWorkbook = async () => {
            const response = await fetch('/data/data_2026.univer.json');
            if (!response.ok) {
                throw new Error('Template data SROI tidak tersedia.');
            }
            const workbook = (await response.json()) as IWorkbookData;
            if (!isActive || !containerRef.current) {
                return;
            }
            const { univer, univerAPI } = createUniver({
                locale: LocaleType.EN_US,
                locales: {
                    [LocaleType.EN_US]: UniverSheetsCoreEnUS,
                },
                presets: [
                    UniverSheetsCorePreset({
                        container: containerRef.current,
                        header: false,
                        toolbar: false,
                        contextMenu: false,
                        formulaBar: false,
                        footer: false,
                        statusBarStatistic: false,
                        disableAutoFocus: true,
                    }),
                ],
            });
            dispose = () => univer.dispose();
            univer.createUnit(UniverInstanceType.UNIVER_SHEET, workbook);
            const activeWorkbook = univerAPI.getActiveWorkbook();
            const worksheet = activeWorkbook?.getSheetByName('Sheet1');
            const sheetData = workbook.sheets['sheet-1'];
            const rowCount = sheetData?.rowCount ?? 365;
            const columnCount = sheetData?.columnCount ?? 26;

            activeWorkbook?.setEditable(false);

            if (worksheet) {
                worksheet
                    .getRange(0, 0, rowCount, columnCount)
                    .setWrapStrategy(univerAPI.Enum.WrapStrategy.CLIP);
                worksheet.setRowHeightsForced(0, rowCount, 32);

                Object.entries(sheetData?.cellData ?? {}).forEach(
                    ([rowIndex, cells]) => {
                        if (cells[0]?.v === 'Stakeholder') {
                            worksheet.setRowHeightsForced(
                                Number(rowIndex),
                                1,
                                88,
                            );
                        }
                    },
                );

                dataSroiColumnWidths.forEach((width, columnIndex) => {
                    worksheet.setColumnWidth(columnIndex, width);
                });
            }

            if (isActive) {
                setIsLoading(false);
            }
        };

        loadWorkbook().catch((error: unknown) => {
            dispose?.();
            dispose = undefined;

            if (isActive) {
                setLoadError(
                    error instanceof Error
                        ? error.message
                        : 'Data SROI gagal dimuat.',
                );
                setIsLoading(false);
            }
        });

        return () => {
            isActive = false;
            dispose?.();
        };
    }, []);

    return (
        <EnumeratorLayout activeNav="sroi" fullWidth>
            <Head title={'Data SROI - ' + project.name} />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        href={route('enumerator.sroi.index')}
                        className="text-sm font-medium text-primary hover:text-primary-dark"
                    >
                        ← Kembali ke Project SROI
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold text-gray-900">
                        {project.name}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {project.projectCode} · Template data SROI
                    </p>
                </div>
                <span className="w-fit rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600">
                    Hanya baca
                </span>
            </div>
            <div className="relative h-[72vh] min-h-[560px] overflow-hidden rounded-none border border-gray-200 bg-white shadow-sm">
                {isLoading && !loadError && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white text-sm text-gray-500">
                        Memuat data SROI...
                    </div>
                )}
                {loadError && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white px-6 text-center text-sm text-red-600">
                        {loadError}
                    </div>
                )}
                <div ref={containerRef} className="h-full w-full" />
            </div>
        </EnumeratorLayout>
    );
}
