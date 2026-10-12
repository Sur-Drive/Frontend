import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Phone,
    Mail,
    MapPin,
    Navigation,
    Car,
    Calendar,
    CheckCircle2,
    XCircle,
    KeyRound,
    ShieldCheck,
    Rocket,
    ArrowRight,
    Search,
    Loader2,
    Users,
    TrendingUp,
    RefreshCw,
    X,
    ChevronLeft,
    ChevronRight,
    Eye,
} from "lucide-react";

const API_BASE = "https://backend-production-01de.up.railway.app";

type EarlyAccessStatus =
    | "new"
    | "contacted"
    | "converted"
    | "rejected"
    | string;

interface EarlyAccessRecord {
    id: string;
    fullName: string;
    phoneNumber: string;
    email: string | null;
    city: string;
    preferredOperatingArea: string;
    vehicle: {
        makeModel: string;
        year: number;
        type: string;
        inGoodCondition: boolean;
        ownership: string;
    };
    hasValidLicence: boolean;
    interestedInEarlyAccess: boolean;
    consentToContact: boolean;
    source: string | null;
    status: EarlyAccessStatus;
    adminNotes: string | null;
    contactedAt: string | null;
    convertedAt: string | null;
    createdAt: string;
}

interface ListResponse {
    items: EarlyAccessRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface StatsResponse {
    total: number;
    byStatus: Record<string, number>;
    topCities: { city: string; count: number }[];
}

export const EarlyAccessAdmin: React.FC = () => {
    const [stats, setStats] = useState<StatsResponse | null>(null);
    const [list, setList] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<EarlyAccessRecord | null>(null);

    // Filters
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [cityFilter, setCityFilter] = useState<string>("");

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState("");
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    // ── Fetch list ────────────────────────────────────────────
    const fetchList = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
            });
            if (debouncedSearch) params.set("q", debouncedSearch);
            if (statusFilter) params.set("status", statusFilter);
            if (cityFilter) params.set("city", cityFilter);

            const res = await fetch(
                `${API_BASE}/early-access/drivers?${params.toString()}`,
            );
            const data = await res.json();
            if (!res.ok) {
                setError(data?.message ?? "Failed to load list");
                return;
            }
            setList(data);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Fetch stats ───────────────────────────────────────────
    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE}/early-access/drivers/stats`);
            const data = await res.json();
            if (res.ok) setStats(data);
        } catch {
            // silent — stats are non-critical
        }
    };

    useEffect(() => {
        fetchList();
    }, [page, debouncedSearch, statusFilter, cityFilter]);

    useEffect(() => {
        fetchStats();
    }, []);

    const refreshAll = () => {
        fetchList();
        fetchStats();
    };

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, statusFilter, cityFilter]);

    return (
        <section className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-medium border border-purple-100 mb-3">
                            <Users className="w-3.5 h-3.5" />
                            <span>Early Access</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-archivo text-purple-900">
                            Driver Interest List
                        </h1>
                    </div>
                    <button
                        onClick={refreshAll}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-purple-100 hover:border-purple-200 text-purple-700 rounded-xl text-sm font-medium transition-colors self-start sm:self-auto"
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </button>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
                    <StatCard
                        label="Total"
                        value={stats?.total ?? 0}
                        icon={Users}
                        accent="purple"
                    />
                    <StatCard
                        label="New"
                        value={stats?.byStatus?.new ?? 0}
                        icon={Rocket}
                        accent="gold"
                    />
                    <StatCard
                        label="Contacted"
                        value={stats?.byStatus?.contacted ?? 0}
                        icon={Phone}
                        accent="blue"
                    />
                    <StatCard
                        label="Converted"
                        value={stats?.byStatus?.converted ?? 0}
                        icon={CheckCircle2}
                        accent="green"
                    />
                    <StatCard
                        label="Rejected"
                        value={stats?.byStatus?.rejected ?? 0}
                        icon={XCircle}
                        accent="red"
                    />
                </div>

                {/* Top cities */}
                {stats?.topCities && stats.topCities.length > 0 && (
                    <div className="bg-white rounded-2xl border border-purple-100 p-5 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-4 h-4 text-purple-700" />
                            <h3 className="text-sm font-semibold text-purple-900">
                                Top Cities by Interest
                            </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {stats.topCities.map((c) => (
                                <button
                                    key={c.city}
                                    onClick={() =>
                                        setCityFilter(
                                            cityFilter === c.city ? "" : c.city,
                                        )
                                    }
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                                        cityFilter === c.city
                                            ? "bg-purple-900 text-white border-purple-900"
                                            : "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100"
                                    }`}
                                >
                                    <MapPin className="w-3 h-3" />
                                    {c.city}
                                    <span className="opacity-60">
                                        · {c.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-purple-100 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="relative md:col-span-2">
                            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, phone, email, city, or vehicle…"
                                className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-11 px-4 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm bg-white"
                        >
                            <option value="">All statuses</option>
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="converted">Converted</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    {(search || statusFilter || cityFilter) && (
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                            <span>Active filters:</span>
                            {search && (
                                <FilterChip
                                    label={`"${search}"`}
                                    onClear={() => setSearch("")}
                                />
                            )}
                            {statusFilter && (
                                <FilterChip
                                    label={statusFilter}
                                    onClear={() => setStatusFilter("")}
                                />
                            )}
                            {cityFilter && (
                                <FilterChip
                                    label={cityFilter}
                                    onClear={() => setCityFilter("")}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* List */}
                {error && (
                    <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                        <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
                    {loading && !list ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="w-6 h-6 text-purple-700 animate-spin" />
                        </div>
                    ) : list?.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                            <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-purple-700" />
                            </div>
                            <h3 className="text-base font-semibold text-purple-900 mb-1">
                                No signups match your filters
                            </h3>
                            <p className="text-sm text-gray-500 max-w-sm">
                                Try clearing the search or status filter.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-purple-100 bg-purple-50/40">
                                            <Th>Driver</Th>
                                            <Th>Contact</Th>
                                            <Th>City</Th>
                                            <Th>Vehicle</Th>
                                            <Th>Status</Th>
                                            <Th>Signed up</Th>
                                            <Th align="right">Actions</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {list?.items.map((d) => (
                                            <tr
                                                key={d.id}
                                                className="border-b border-gray-100 last:border-0 hover:bg-purple-50/30 transition-colors"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="font-medium text-gray-900">
                                                        {d.fullName}
                                                    </div>
                                                    {d.source && (
                                                        <div className="text-xs text-gray-400 mt-0.5">
                                                            via {d.source}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="text-gray-700">
                                                        {d.phoneNumber}
                                                    </div>
                                                    {d.email && (
                                                        <div className="text-xs text-gray-400">
                                                            {d.email}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-gray-700">
                                                    {d.city}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="text-gray-700">
                                                        {d.vehicle.makeModel}
                                                    </div>
                                                    <div className="text-xs text-gray-400 capitalize">
                                                        {d.vehicle.type} ·{" "}
                                                        {d.vehicle.year}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <StatusPill
                                                        status={d.status}
                                                    />
                                                </td>
                                                <td className="px-5 py-4 text-xs text-gray-500">
                                                    {new Date(
                                                        d.createdAt,
                                                    ).toLocaleDateString()}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        onClick={() =>
                                                            setSelected(d)
                                                        }
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {list?.items.map((d) => (
                                    <button
                                        key={d.id}
                                        onClick={() => setSelected(d)}
                                        className="w-full text-left p-4 hover:bg-purple-50/30 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {d.fullName}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {d.phoneNumber}
                                                </div>
                                            </div>
                                            <StatusPill status={d.status} />
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {d.city}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <Car className="w-3 h-3" />
                                                {d.vehicle.makeModel}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Pagination */}
                            {list && list.totalPages > 1 && (
                                <div className="flex items-center justify-between px-5 py-4 border-t border-purple-100 bg-purple-50/20">
                                    <div className="text-xs text-gray-500">
                                        Page {list.page} of {list.totalPages} ·{" "}
                                        {list.total} total
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() =>
                                                setPage((p) =>
                                                    Math.max(1, p - 1),
                                                )
                                            }
                                            disabled={page === 1}
                                            className="p-2 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4 text-purple-700" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                setPage((p) =>
                                                    Math.min(
                                                        list.totalPages,
                                                        p + 1,
                                                    ),
                                                )
                                            }
                                            disabled={page === list.totalPages}
                                            className="p-2 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4 text-purple-700" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Detail drawer */}
            <AnimatePresence>
                {selected && (
                    <DetailDrawer
                        record={selected}
                        onClose={() => setSelected(null)}
                    />
                )}
            </AnimatePresence>
        </section>
    );
};

const DetailDrawer: React.FC<{
    record: EarlyAccessRecord;
    onClose: () => void;
}> = ({ record, onClose }) => {
    // Close on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
                className="fixed inset-0 bg-purple-950/40 backdrop-blur-sm z-40"
            />
            <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-purple-100 px-5 py-4 flex items-start justify-between gap-3 z-10">
                    <div className="min-w-0">
                        <div className="text-xs text-purple-600 font-medium mb-1">
                            Early Access Signup
                        </div>
                        <h2 className="text-lg font-archivo text-purple-900 truncate">
                            {record.fullName}
                        </h2>
                        <div className="mt-2">
                            <StatusPill status={record.status} />
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-purple-50 rounded-lg transition-colors flex-shrink-0"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-6">
                    <Section title="Contact">
                        <DetailRow
                            icon={Phone}
                            label="Phone"
                            value={record.phoneNumber}
                        />
                        <DetailRow
                            icon={Mail}
                            label="Email"
                            value={record.email ?? "—"}
                        />
                    </Section>

                    <Section title="Location">
                        <DetailRow
                            icon={MapPin}
                            label="City"
                            value={record.city}
                        />
                        <DetailRow
                            icon={Navigation}
                            label="Preferred Area"
                            value={record.preferredOperatingArea}
                        />
                    </Section>

                    <Section title="Vehicle">
                        <DetailRow
                            icon={Car}
                            label="Make & Model"
                            value={record.vehicle.makeModel}
                        />
                        <DetailRow
                            icon={Calendar}
                            label="Year"
                            value={String(record.vehicle.year)}
                        />
                        <DetailRow
                            icon={Car}
                            label="Type"
                            value={record.vehicle.type}
                        />
                        <DetailRow
                            icon={KeyRound}
                            label="Ownership"
                            value={
                                record.vehicle.ownership === "owner"
                                    ? "Owns vehicle"
                                    : "Drives for someone else"
                            }
                        />
                        <BoolRow
                            label="In good condition"
                            value={record.vehicle.inGoodCondition}
                        />
                    </Section>

                    <Section title="Eligibility">
                        <BoolRow
                            label="Valid driver's licence"
                            value={record.hasValidLicence}
                        />
                        <BoolRow
                            label="Interested in early access"
                            value={record.interestedInEarlyAccess}
                        />
                        <BoolRow
                            label="Consent to contact"
                            value={record.consentToContact}
                        />
                    </Section>

                    <Section title="Metadata">
                        <DetailRow
                            icon={Rocket}
                            label="Source"
                            value={record.source ?? "—"}
                        />
                        <DetailRow
                            icon={Calendar}
                            label="Signed up"
                            value={new Date(record.createdAt).toLocaleString()}
                        />
                        {record.contactedAt && (
                            <DetailRow
                                icon={CheckCircle2}
                                label="Contacted at"
                                value={new Date(
                                    record.contactedAt,
                                ).toLocaleString()}
                            />
                        )}
                        {record.convertedAt && (
                            <DetailRow
                                icon={CheckCircle2}
                                label="Converted at"
                                value={new Date(
                                    record.convertedAt,
                                ).toLocaleString()}
                            />
                        )}
                    </Section>

                    {record.adminNotes && (
                        <Section title="Admin Notes">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {record.adminNotes}
                            </p>
                        </Section>
                    )}
                </div>

                {/* Footer actions */}
                <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-purple-100 px-5 py-4 flex items-center gap-3">
                    <a
                        href={`tel:${record.phoneNumber}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-medium text-sm transition-colors"
                    >
                        <Phone className="w-4 h-4" />
                        Call
                    </a>
                    <a
                        href={`https://wa.me/${record.phoneNumber.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-purple-200 hover:border-purple-300 text-purple-700 font-medium text-sm transition-colors"
                    >
                        <ArrowRight className="w-4 h-4" />
                        WhatsApp
                    </a>
                </div>
            </motion.aside>
        </>
    );
};

const Th: React.FC<{
    children: React.ReactNode;
    align?: "left" | "right";
}> = ({ children, align = "left" }) => (
    <th
        className={`px-5 py-3 text-xs font-semibold text-purple-900/70 uppercase tracking-wider ${
            align === "right" ? "text-right" : "text-left"
        }`}
    >
        {children}
    </th>
);

const Section: React.FC<{
    title: string;
    children: React.ReactNode;
}> = ({ title, children }) => (
    <div>
        <h3 className="text-xs font-semibold text-purple-900/70 uppercase tracking-wider mb-3">
            {title}
        </h3>
        <div className="space-y-2">{children}</div>
    </div>
);

const DetailRow: React.FC<{
    icon: React.ElementType;
    label: string;
    value: string;
}> = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 text-sm">
        <Icon className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-400">{label}</div>
            <div className="text-gray-800 break-words">{value}</div>
        </div>
    </div>
);

const BoolRow: React.FC<{ label: string; value: boolean }> = ({
    label,
    value,
}) => (
    <div className="flex items-center gap-3 text-sm">
        {value ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
        ) : (
            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
        )}
        <span className="text-gray-700">{label}</span>
    </div>
);

const FilterChip: React.FC<{
    label: string;
    onClear: () => void;
}> = ({ label, onClear }) => (
    <button
        onClick={onClear}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 transition-colors"
    >
        {label}
        <X className="w-3 h-3" />
    </button>
);

const StatCard: React.FC<{
    label: string;
    value: number;
    icon: React.ElementType;
    accent: "purple" | "gold" | "blue" | "green" | "red";
}> = ({ label, value, icon: Icon, accent }) => {
    const accents: Record<string, string> = {
        purple: "from-purple-500/10 to-purple-500/5 text-purple-700",
        gold: "from-amber-500/10 to-amber-500/5 text-amber-700",
        blue: "from-blue-500/10 to-blue-500/5 text-blue-700",
        green: "from-green-500/10 to-green-500/5 text-green-700",
        red: "from-red-500/10 to-red-500/5 text-red-700",
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-purple-100 p-4 relative overflow-hidden"
        >
            <div
                className={`absolute inset-0 bg-gradient-to-br ${accents[accent]} pointer-events-none`}
            />
            <div className="relative">
                <div className="flex items-center justify-between mb-2">
                    <Icon className="w-4 h-4 opacity-70" />
                </div>
                <div className="text-2xl font-archivo text-gray-900">
                    {value}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
        </motion.div>
    );
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
    const styles: Record<string, string> = {
        new: "bg-purple-100 text-purple-700 border-purple-200",
        contacted: "bg-blue-100 text-blue-700 border-blue-200",
        converted: "bg-green-100 text-green-700 border-green-200",
        rejected: "bg-red-100 text-red-700 border-red-200",
    };
    const cls = styles[status] ?? "bg-gray-100 text-gray-700 border-gray-200";

    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${cls}`}
        >
            {status}
        </span>
    );
};

export default EarlyAccessAdmin;
