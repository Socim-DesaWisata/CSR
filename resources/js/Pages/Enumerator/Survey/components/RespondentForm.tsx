import {
    Button,
    FormSection,
    MaterialIcon,
    RadioGroup,
    SelectField,
    TextInputField,
} from '@/Components/Enumerator';

interface SelectOption {
    value: string;
    label: string;
}

// Education options — matches education_level column (varchar 50)
const educationOptions: SelectOption[] = [
    { value: 'sd', label: 'SD/Sederajat' },
    { value: 'smp', label: 'SMP/Sederajat' },
    { value: 'sma', label: 'SMA/Sederajat' },
    { value: 'd3', label: 'Diploma (D1/D2/D3)' },
    { value: 's1', label: 'Sarjana (S1)' },
    { value: 's2', label: 'Magister (S2)' },
    { value: 's3', label: 'Doktor (S3)' },
];

// Gender options — matches gender column (varchar 10)
const genderOptions = [
    { value: 'male', label: 'Pria', icon: 'male' },
    { value: 'female', label: 'Wanita', icon: 'female' },
];

// Respondent status options — matches respondent_status column (varchar 30)
const respondentStatusOptions: SelectOption[] = [
    { value: 'kepala_keluarga', label: 'Kepala Keluarga' },
    { value: 'ibu_rumah_tangga', label: 'Ibu Rumah Tangga' },
    { value: 'anggota_keluarga', label: 'Anggota Keluarga' },
    { value: 'lainnya', label: 'Lainnya' },
];

/**
 * RespondentData — maps 1:1 to kolom tabel `respondents`
 * (company_id, project_id, created_by diisi dari controller)
 */
export interface RespondentData {
    name: string; // varchar 150, required
    address: string; // text, nullable
    phone: string; // varchar 32, nullable
    age: string; // integer, nullable
    gender: string; // varchar 10, nullable
    respondent_status: string; // varchar 30, nullable
    education_level: string; // varchar 50, nullable
    main_occupation: string; // varchar 80, nullable
    monthly_income: string; // bigInteger, nullable
}

interface RespondentFormProps {
    data: RespondentData;
    onChange: (data: RespondentData) => void;
    onBack: () => void;
    onNext: () => void;
}

export default function RespondentForm({
    data,
    onChange,
    onBack,
    onNext,
}: RespondentFormProps) {
    const updateField = (field: keyof RespondentData, value: string) => {
        onChange({ ...data, [field]: value });
    };

    const updateDigitsOnly = (field: keyof RespondentData, value: string) => {
        onChange({ ...data, [field]: value.replace(/\D/g, '') });
    };

    const formatThousand = (value: string): string => {
        const digits = value.replace(/\D/g, '');
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    return (
        <>
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                        Data Responden
                    </h1>
                    <p className="text-sm text-gray-500">
                        Silakan isi data demografi responden dengan lengkap.
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <div className="flex flex-col gap-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                {/* Section 1: Identitas Pribadi */}
                <FormSection icon="person" title="Identitas Pribadi">
                    {/* Nama Lengkap */}
                    <TextInputField
                        label="Nama Lengkap"
                        placeholder="Contoh: Budi Santoso"
                        icon="badge"
                        value={data.name}
                        onChange={(value) => updateField('name', value)}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Nomor Telepon */}
                        <TextInputField
                            label="Nomor Telepon"
                            placeholder="Contoh: 08123456789"
                            icon="phone"
                            type="tel"
                            value={data.phone}
                            onChange={(value) =>
                                updateDigitsOnly('phone', value)
                            }
                        />

                        {/* Usia */}
                        <TextInputField
                            label="Usia"
                            placeholder="Tahun"
                            icon="cake"
                            value={data.age}
                            onChange={(value) => updateDigitsOnly('age', value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Jenis Kelamin */}
                        <RadioGroup
                            label="Jenis Kelamin"
                            name="gender"
                            options={genderOptions}
                            value={data.gender}
                            onChange={(value) => updateField('gender', value)}
                        />

                        {/* Status dalam Keluarga */}
                        <SelectField
                            label="Status dalam Keluarga"
                            placeholder="Pilih status"
                            options={respondentStatusOptions}
                            value={data.respondent_status}
                            onChange={(value) =>
                                updateField('respondent_status', value)
                            }
                        />
                    </div>
                </FormSection>

                {/* Section 2: Sosial & Ekonomi */}
                <FormSection
                    icon="payments"
                    title="Sosial & Ekonomi"
                    iconColor="text-primary"
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Pendidikan Terakhir */}
                        <SelectField
                            label="Pendidikan Terakhir"
                            placeholder="Pilih pendidikan"
                            options={educationOptions}
                            value={data.education_level}
                            onChange={(value) =>
                                updateField('education_level', value)
                            }
                        />

                        {/* Pekerjaan Utama */}
                        <TextInputField
                            label="Pekerjaan Utama"
                            placeholder="Contoh: Pegawai Swasta, Guru"
                            icon="work"
                            value={data.main_occupation}
                            onChange={(value) =>
                                updateField('main_occupation', value)
                            }
                        />
                    </div>

                    {/* Pendapatan per Bulan */}
                    <TextInputField
                        label="Pendapatan per Bulan (Rp)"
                        placeholder="Contoh: 1.500.000"
                        icon="payments"
                        value={formatThousand(data.monthly_income)}
                        onChange={(value) =>
                            updateDigitsOnly('monthly_income', value)
                        }
                    />
                </FormSection>

                {/* Section 3: Alamat */}
                <FormSection
                    icon="location_on"
                    title="Alamat"
                    iconColor="text-primary"
                >
                    {/* Alamat Lengkap */}
                    <TextInputField
                        label="Alamat Lengkap"
                        placeholder="Contoh: Jl. Merdeka No. 1, RT 01/RW 02, Kel. Sukamaju, Kec. Cimahi Tengah"
                        icon="home"
                        value={data.address}
                        onChange={(value) => updateField('address', value)}
                    />
                </FormSection>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse items-center justify-between gap-4 pb-8 sm:flex-row">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 font-medium text-gray-600 transition-colors hover:text-gray-900"
                >
                    <MaterialIcon name="arrow_back" className="text-lg" />
                    <span>Kembali</span>
                </button>

                <Button
                    variant="primary"
                    icon="arrow_forward"
                    onClick={onNext}
                    className="w-full px-8 sm:w-auto"
                >
                    Lanjut ke Kuesioner
                </Button>
            </div>
        </>
    );
}
