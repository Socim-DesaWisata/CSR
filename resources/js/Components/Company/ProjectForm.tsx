import {
    AssessmentTypeCard,
    FormInput,
    FormTextarea,
    Icon,
} from '@/Components/Company';
import { createProjectData } from '@/data';
import { useEffect, useState } from 'react';

// ─── Types ─────────────────────────────────────────────────

export interface Province {
    id: number;
    code: string;
    name: string;
}

export interface City {
    id: number;
    code: string;
    name: string;
    province_id: number;
}

export interface District {
    id: number;
    code: string;
    name: string;
    city_id: number;
}

export interface LocationEntry {
    id: number;
    province: Province;
    city: City;
    district: District;
}

export interface DescriptiveQuestion {
    id?: number | null;
    title: string;
}

export interface ProjectFormData {
    name: string;
    description: string;
    status?: string;
    target_ikm_count: number;
    target_sloi_count: number;
    start_date: string;
    end_date: string;
    enable_ikm: boolean;
    enable_sloi: boolean;
    enable_sroi: boolean;
    ikm_template_id: number | null;
    sloi_template_id: number | null;
    district_ids: number[];
    descriptive_questions: DescriptiveQuestion[];
}

export interface ProjectFormErrors {
    name?: string;
    description?: string;
    target_ikm_count?: string;
    target_sloi_count?: string;
    start_date?: string;
    end_date?: string;
    district_ids?: string;
    [key: string]: string | undefined;
}

interface ProjectFormProps {
    data: ProjectFormData;
    setData: <K extends keyof ProjectFormData>(
        key: K,
        value: ProjectFormData[K],
    ) => void;
    errors: ProjectFormErrors;
    provinces: Province[];
    initialLocations?: LocationEntry[];
    showStatusField?: boolean;
    targetError?: string;
    setTargetError?: (error: string) => void;
}

// ─── Static Data ───────────────────────────────────────────

const assessmentTypes = createProjectData.assessmentTypes;

// ─── Component ─────────────────────────────────────────────

export default function ProjectForm({
    data,
    setData,
    errors,
    provinces,
    initialLocations = [],
    showStatusField = false,
    targetError = '',
    setTargetError,
}: ProjectFormProps) {
    // Area selection state
    const [cities, setCities] = useState<City[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<{
        province: Province | null;
        city: City | null;
        district: District | null;
    }>({
        province: null,
        city: null,
        district: null,
    });
    const [selectedLocations, setSelectedLocations] =
        useState<LocationEntry[]>(initialLocations);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Sync initialLocations on first mount (for edit mode)
    useEffect(() => {
        if (!initialized && initialLocations.length > 0) {
            setSelectedLocations(initialLocations);
            setInitialized(true);
        }
    }, [initialLocations, initialized]);

    // Fetch cities when province changes
    useEffect(() => {
        if (selectedLocation.province) {
            setLoadingCities(true);
            setCities([]);
            setDistricts([]);
            setSelectedLocation((prev) => ({
                ...prev,
                city: null,
                district: null,
            }));

            fetch(
                `/api/area/cities?province_id=${selectedLocation.province.id}`,
            )
                .then((res) => res.json())
                .then((d) => {
                    setCities(d);
                    setLoadingCities(false);
                })
                .catch(() => setLoadingCities(false));
        }
    }, [selectedLocation.province]);

    // Fetch districts when city changes
    useEffect(() => {
        if (selectedLocation.city) {
            setLoadingDistricts(true);
            setDistricts([]);
            setSelectedLocation((prev) => ({ ...prev, district: null }));

            fetch(`/api/area/districts?city_id=${selectedLocation.city.id}`)
                .then((res) => res.json())
                .then((d) => {
                    setDistricts(d);
                    setLoadingDistricts(false);
                })
                .catch(() => setLoadingDistricts(false));
        }
    }, [selectedLocation.city]);

    // Update district_ids when selectedLocations changes
    useEffect(() => {
        const uniqueDistrictIds = Array.from(
            new Set(selectedLocations.map((loc) => loc.district.id)),
        );
        setData('district_ids', uniqueDistrictIds);
    }, [selectedLocations]);

    const handleAssessmentTypeChange = (typeId: string, checked: boolean) => {
        if (typeId === 'ikm') {
            setData('enable_ikm', checked);
            // Reset target jika di-uncheck
            if (!checked) {
                setData('target_ikm_count', 0);
            }
        } else if (typeId === 'sloi') {
            setData('enable_sloi', checked);
            // Reset target jika di-uncheck
            if (!checked) {
                setData('target_sloi_count', 0);
            }
        } else if (typeId === 'sroi') {
            setData('enable_sroi', checked);
        }

        // Clear error saat checkbox berubah
        if (setTargetError) {
            setTargetError('');
        }
    };

    const handleProvinceChange = (provinceId: string) => {
        const province = provinces.find((p) => p.id === parseInt(provinceId));
        setSelectedLocation({
            province: province || null,
            city: null,
            district: null,
        });
    };

    const handleCityChange = (cityId: string) => {
        const city = cities.find((c) => c.id === parseInt(cityId));
        setSelectedLocation((prev) => ({
            ...prev,
            city: city || null,
            district: null,
        }));
    };

    const handleDistrictChange = (districtId: string) => {
        const district = districts.find((d) => d.id === parseInt(districtId));
        setSelectedLocation((prev) => ({
            ...prev,
            district: district || null,
        }));
    };

    const addLocation = () => {
        if (
            selectedLocation.province &&
            selectedLocation.city &&
            selectedLocation.district
        ) {
            const exists = selectedLocations.some(
                (loc) => loc.district.id === selectedLocation.district!.id,
            );

            if (!exists) {
                setSelectedLocations((prev) => [
                    ...prev,
                    {
                        id: Date.now(),
                        province: selectedLocation.province!,
                        city: selectedLocation.city!,
                        district: selectedLocation.district!,
                    },
                ]);

                setSelectedLocation({
                    province: null,
                    city: null,
                    district: null,
                });
                setCities([]);
                setDistricts([]);
            }
        }
    };

    const removeLocation = (id: number) => {
        setSelectedLocations((prev) => prev.filter((loc) => loc.id !== id));
    };

    return (
        <div className="space-y-8">
            {/* Nama Proyek */}
            <FormInput
                label="Nama Proyek"
                required
                placeholder="contoh: Penilaian Dampak CSR 2024"
                value={data.name}
                onChange={(value) => setData('name', value)}
                error={errors.name}
            />

            {/* Status Proyek (hanya ditampilkan saat edit) */}
            {showStatusField && (
                <div>
                    <label className="mb-2 block text-sm font-bold text-slate-900">
                        Status Proyek
                    </label>
                    <select
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        value={data.status || 'draft'}
                        onChange={(e) => setData('status', e.target.value)}
                    >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                    </select>
                    {errors.status && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.status}
                        </p>
                    )}
                </div>
            )}

            {/* Deskripsi */}
            <FormTextarea
                label="Deskripsi Proyek"
                placeholder="Jelaskan secara singkat tujuan dan konteks proyek penilaian ini..."
                value={data.description}
                onChange={(value) => setData('description', value)}
                error={errors.description}
            />

            {/* Tipe Penilaian */}
            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-900">
                    Tipe Penilaian{' '}
                    <span className="ml-1 font-normal text-slate-400">
                        (Pilih satu atau lebih)
                    </span>
                </label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {assessmentTypes.map((type) => (
                        <AssessmentTypeCard
                            key={type.id}
                            id={type.id}
                            icon={type.icon}
                            title={type.title}
                            description={type.description}
                            checked={
                                type.id === 'ikm'
                                    ? data.enable_ikm
                                    : type.id === 'sloi'
                                      ? data.enable_sloi
                                      : data.enable_sroi
                            }
                            onChange={(checked) =>
                                handleAssessmentTypeChange(type.id, checked)
                            }
                        />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Target Responden IKM */}
                <FormInput
                    label="Target Responden IKM"
                    type="number"
                    required
                    value={data.target_ikm_count.toString()}
                    onChange={(value) => {
                        const numValue = parseInt(value) || 0;
                        setData('target_ikm_count', numValue);
                        // Clear error saat user mulai mengisi
                        if (setTargetError) {
                            setTargetError('');
                        }
                    }}
                    helpText="Jumlah responden IKM yang diharapkan"
                    error={errors.target_ikm_count}
                    disabled={!data.enable_ikm}
                />

                {/* Target Responden SLOI */}
                <FormInput
                    label="Target Responden SLOI"
                    type="number"
                    required
                    value={data.target_sloi_count.toString()}
                    onChange={(value) => {
                        const numValue = parseInt(value) || 0;
                        setData('target_sloi_count', numValue);
                        // Clear error saat user mulai mengisi
                        if (setTargetError) {
                            setTargetError('');
                        }
                    }}
                    helpText="Jumlah responden SLOI yang diharapkan"
                    error={errors.target_sloi_count}
                    disabled={!data.enable_sloi}
                />
            </div>

            {/* Target Error Message */}
            {targetError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex size-5 items-center justify-center rounded-full bg-red-100 text-red-600">
                            <Icon name="error" className="text-sm" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">
                                {targetError}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Tanggal Mulai */}
                <FormInput
                    label="Tanggal Mulai"
                    type="date"
                    value={data.start_date}
                    onChange={(value) => setData('start_date', value)}
                    error={errors.start_date}
                />

                {/* Tanggal Selesai */}
                <FormInput
                    label="Tanggal Selesai"
                    type="date"
                    value={data.end_date}
                    onChange={(value) => setData('end_date', value)}
                    error={errors.end_date}
                />
            </div>

            {/* Lokasi Proyek */}
            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-900">
                    Lokasi Proyek <span className="text-red-500">*</span>
                    <span className="ml-1 font-normal text-slate-400">
                        (Pilih kecamatan)
                    </span>
                </label>

                {/* Area Selection */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {/* Province */}
                    <div>
                        <select
                            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            value={selectedLocation.province?.id || ''}
                            onChange={(e) =>
                                handleProvinceChange(e.target.value)
                            }
                        >
                            <option value="">Pilih Provinsi</option>
                            {provinces.map((province) => (
                                <option key={province.id} value={province.id}>
                                    {province.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* City */}
                    <div>
                        <select
                            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-slate-100"
                            value={selectedLocation.city?.id || ''}
                            onChange={(e) => handleCityChange(e.target.value)}
                            disabled={
                                !selectedLocation.province || loadingCities
                            }
                        >
                            <option value="">
                                {loadingCities
                                    ? 'Memuat...'
                                    : 'Pilih Kota/Kabupaten'}
                            </option>
                            {cities.map((city) => (
                                <option key={city.id} value={city.id}>
                                    {city.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* District */}
                    <div>
                        <select
                            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-slate-100"
                            value={selectedLocation.district?.id || ''}
                            onChange={(e) =>
                                handleDistrictChange(e.target.value)
                            }
                            disabled={
                                !selectedLocation.city || loadingDistricts
                            }
                        >
                            <option value="">
                                {loadingDistricts
                                    ? 'Memuat...'
                                    : 'Pilih Kecamatan'}
                            </option>
                            {districts.map((district) => (
                                <option key={district.id} value={district.id}>
                                    {district.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Add Button */}
                    <div>
                        <button
                            type="button"
                            onClick={addLocation}
                            disabled={!selectedLocation.district}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-btn px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-btn-hover disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            <Icon name="add" className="text-sm" />
                            Tambah
                        </button>
                    </div>
                </div>

                {/* Selected Locations */}
                {selectedLocations.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-slate-700">
                            Lokasi terpilih ({selectedLocations.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {selectedLocations.map((loc) => (
                                <div
                                    key={loc.id}
                                    className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm"
                                >
                                    <span className="text-primary">
                                        {loc.district.name}, {loc.city.name},{' '}
                                        {loc.province.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeLocation(loc.id)}
                                        className="text-primary hover:text-red-500"
                                    >
                                        <Icon
                                            name="close"
                                            className="text-sm"
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {errors.district_ids && (
                    <p className="text-sm text-red-500">
                        {errors.district_ids}
                    </p>
                )}
            </div>

            {/* Pertanyaan Kualitatif */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-slate-900">
                        Pertanyaan Kualitatif
                        <span className="ml-1 font-normal text-slate-400">
                            (Opsional)
                        </span>
                    </label>
                    <button
                        type="button"
                        onClick={() =>
                            setData('descriptive_questions', [
                                ...data.descriptive_questions,
                                { id: null, title: '' },
                            ])
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                        <Icon name="add" className="text-sm" />
                        Tambah Pertanyaan
                    </button>
                </div>

                {data.descriptive_questions.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-8 text-center">
                        <Icon
                            name="help_outline"
                            className="mb-2 text-3xl text-slate-300"
                        />
                        <p className="text-sm text-slate-400">
                            Belum ada Pertanyaan Kualitatif. Klik &quot;Tambah
                            Pertanyaan&quot; untuk menambahkan.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.descriptive_questions.map((q, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
                            >
                                <span className="mt-2.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                    {idx + 1}
                                </span>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Tulis Pertanyaan Kualitatif di sini..."
                                        value={q.title}
                                        onChange={(e) => {
                                            const updated = [
                                                ...data.descriptive_questions,
                                            ];
                                            updated[idx] = {
                                                ...updated[idx],
                                                title: e.target.value,
                                            };
                                            setData(
                                                'descriptive_questions',
                                                updated,
                                            );
                                        }}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    {errors[
                                        `descriptive_questions.${idx}.title`
                                    ] && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {
                                                errors[
                                                    `descriptive_questions.${idx}.title`
                                                ]
                                            }
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const updated =
                                            data.descriptive_questions.filter(
                                                (_, i) => i !== idx,
                                            );
                                        setData(
                                            'descriptive_questions',
                                            updated,
                                        );
                                    }}
                                    className="mt-2 flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-100 hover:text-red-500"
                                >
                                    <Icon name="delete" className="text-base" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
