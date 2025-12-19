import { useEffect, useState } from 'react';
import style from '../css/uploads.module.css';
import { FaUpload, FaCheckCircle, FaDownload, FaTrash, FaExclamationTriangle } from "react-icons/fa";
import * as xlsx from 'xlsx';
import Pagination from '../components/pagination';
import toast from "react-hot-toast";

const Uploads = () => {
    const [sheetData, setSheetData] = useState([]);
    const [existingCount, setExistingCount] = useState(0);
    const [showDelete, setShowDelete] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const postPerPage = 10;

    const token = localStorage.getItem("authToken");

   const downloadTemplate = () => {
    const data = [
        {
            ID: "Leave empty or optional",
            Date: "DD/MM/YYYY (example: 25/12/2025)",
            Time: "HH:MM or HH:MM:SS (example: 14:30 or 14:30:00)",
            contentTopic: "Write your post content/topic here"
        }
    ];

    const ws = xlsx.utils.json_to_sheet(data, {
        header: ["ID", "Date", "Time", "contentTopic"],
        skipHeader: false
    });

    // Make instruction row visually clear (optional but helpful)
    ws["!cols"] = [
        { wch: 18 },
        { wch: 32 },
        { wch: 36 },
        { wch: 40 }
    ];

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Template");

    xlsx.writeFile(wb, "post_upload_template.xlsx");
    toast.success("Template downloaded");
};


    useEffect(() => {
        // Reset to page 1 when data changes
        const totalPages = Math.ceil(sheetData.length / postPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (sheetData.length > 0 && currentPage > totalPages) {
            setCurrentPage(1);
        }
    }, [sheetData.length, currentPage, postPerPage]);


    useEffect(() => {
        const checkExisting = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/getExcelData`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const result = await res.json();

                if (result.success && result.count > 0) {
                    setExistingCount(result.count);
                }
            } catch (err) {
                console.error(err);
            }
        };
        checkExisting();
    }, [token]);


    const parseAnyDate = (v) => {
        if (!v && v !== 0) return null;
        if (v instanceof Date) return v;

        if (typeof v === "number") {
            const base = new Date(1899, 11, 30);
            let days = Math.floor(v);
            if (days > 60) days -= 1;
            base.setDate(base.getDate() + days);
            return base;
        }

        if (typeof v === "string") {
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
                const [d, m, y] = v.split("/");
                return new Date(y, m - 1, d);
            }
            const d = new Date(v);
            if (!isNaN(d)) return d;
        }
        return null;
    };

    const normalizeDate = (v) => {
        const d = parseAnyDate(v);
        if (!d) return "-";
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    };

    const normalizeTime = (v) => {
        if (!v && v !== 0) return "00:00:00";
        if (typeof v === "number" && v < 1) {
            const s = Math.round(v * 86400);
            return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
        }
        if (typeof v === "string") {
            if (/^\d{2}:\d{2}$/.test(v)) return `${v}:00`;
            if (/^\d{2}:\d{2}:\d{2}$/.test(v)) return v;
        }
        const d = parseAnyDate(v);
        return d
            ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`
            : "00:00:00";
    };

    const normalizeText = (text = "") => {
        return String(text)
            // fix UTF-8 mis-decoding
            .replace(/â/g, "–")
            .replace(/â/g, "—")
            .replace(/â|â/g, "’")
            .replace(/â|â/g, "”")
            .replace(/â¢/g, "•")
            // fallback: force UTF-8
            .normalize("NFC");
    };


    const fetchExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/)) {
            toast.error("Please upload an Excel or CSV file");
            return;
        }

        try {
            const buffer = await file.arrayBuffer();
            const wb = xlsx.read(buffer);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = xlsx.utils.sheet_to_json(ws);

            if (rows.length > 31) {
                toast.error("Maximum 31 rows allowed per month");
                return;
            }

            if (rows.length === 0) {
                toast.error("The file appears to be empty");
                return;
            }

            const processed = rows.map(r => ({
                ID: r.ID || r.Id || "-",
                Date: normalizeDate(r.Date),
                Time: normalizeTime(r.Time || r.Date),
                contentTopic: normalizeText(
                    r.contentTopic || r.content || r.topic || ""
                ),
                status: "Scheduled"
            }));


            setSheetData(processed);
            setShowDelete(false);
            setCurrentPage(1); // Reset to first page when new data loads
            toast.success(`Loaded ${processed.length} row${processed.length !== 1 ? 's' : ''}`);
        } catch {
            toast.error("Error reading Excel file");
        }
    };

    /* ===============================
       UPLOAD
    =============================== */
    const handleUpload = async () => {
        if (sheetData.length === 0) {
            toast.error("No data to upload");
            return;
        }

        setIsUploading(true);
        const loadingToast = toast.loading("Uploading posts...", { id: "upload" });

        const payload = sheetData.map(r => ({
            Id: r.ID,
            date: r.Date,
            time: r.Time,
            contentTopic: r.contentTopic,
            status: "Scheduled"
        }));

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/saveExcelData`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!result.success) {
                toast.error(
                    `You already have ${existingCount} scheduled posts. Please delete them to continue.`,
                    { id: "upload" }
                );
                setShowDelete(true);
                return;
            }

            toast.success("Uploaded successfully", { id: "upload" });
            setSheetData([]);
            setShowDelete(false);
            setExistingCount(existingCount + sheetData.length);
            setCurrentPage(1); // Reset pagination after upload
        } catch (error) {
            toast.error("Upload failed. Please try again.", { id: "upload" });
        } finally {
            setIsUploading(false);
        }
    };


    const deleteExisting = async () => {
        if (!window.confirm(`Are you sure you want to delete all ${existingCount} existing posts? This action cannot be undone.`)) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/deleteExcelData`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            const result = await res.json();

            if (result.success) {
                toast.success(`Deleted ${existingCount} posts`);
                setExistingCount(0);
                setShowDelete(false);
            } else {
                toast.error(result.message || "Delete failed");
            }
        } catch (error) {
            toast.error("Delete failed. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };


    const downloadExisting = async () => {
        if (existingCount === 0) {
            toast.error("No data available to download");
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/getExcelData`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();

            if (!result.success || result.count === 0) {
                toast.error("No data available to download");
                return;
            }

            const ws = xlsx.utils.json_to_sheet(result.data);
            const wb = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(wb, ws, "Posts");
            xlsx.writeFile(wb, `scheduled_posts_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success("Download started");
        } catch {
            toast.error("Download failed");
        }
    };

    const indexOfLastPost = currentPage * postPerPage;
    const indexOfFirstPost = indexOfLastPost - postPerPage;
    const currentPosts = sheetData.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.ceil(sheetData.length / postPerPage);

    return (
        <div className={style.uploadContainer}>

            <div className={style.headerSection}>
                <div className={style.uploadsTitle}>
                    <h1>Upload Posts</h1>
                    <p>Upload Excel/CSV to schedule posts (Max 31 rows per month)</p>
                </div>

                <div className={style.statsContainer}>
                    {existingCount > 0 && (
                        <div className={style.existingStats}>
                            <FaExclamationTriangle className={style.warningIcon} />
                            <span>{existingCount} scheduled posts already exist</span>
                        </div>
                    )}
                    <div className={style.actionButtons}>
                        <button
                            onClick={downloadExisting}
                            className={style.downloadBtn}
                            disabled={existingCount === 0}
                        >
                            <FaDownload /> Download Existing
                        </button>
                        <button
                            onClick={downloadTemplate}
                            className={style.downloadBtn}
                        >
                            <FaDownload /> Download Template
                        </button>

                        {showDelete && (
                            <button
                                onClick={deleteExisting}
                                className={style.deleteBtn}
                                disabled={isDeleting}
                            >
                                <FaTrash /> {isDeleting ? 'Deleting...' : 'Delete Existing'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className={style.uploadSection}>
                <div className={style.uploadCard}>
                    <input
                        type="file"
                        id="file-upload"
                        className={style.fileInput}
                        accept=".xlsx,.xls,.csv"
                        onChange={fetchExcel}
                    />
                    <label htmlFor="file-upload" className={style.uploadLabel}>
                        <div className={style.uploadIcon}>
                            <FaUpload className={style.icon} />
                        </div>
                        <h3>Upload Excel or CSV File</h3>
                        <p>Click to browse or drag and drop</p>
                        <span className={style.fileFormat}>Supports: .xlsx, .xls, .csv</span>
                    </label>
                </div>

                <div className={style.instructions}>
                    <h4>File Requirements:</h4>
                    <ul>
                        <li>Maximum 31 rows per month</li>
                        <li>Required columns: Date, Time, contentTopic</li>
                        <li>Date format: DD/MM/YYYY or Excel serial date</li>
                        <li>Time format: HH:MM or HH:MM:SS</li>
                    </ul>
                </div>
            </div>

            {sheetData.length > 0 && (
                <div className={style.tableContainer}>
                    <div className={style.tableHeader}>
                        <div className={style.tableTitle}>
                            <FaCheckCircle className={style.successIcon} />
                            <span>Preview ({sheetData.length} rows)</span>
                        </div>
                        <button
                            className={style.uploadBtn}
                            onClick={handleUpload}
                            disabled={isUploading}
                        >
                            {isUploading ? 'Uploading...' : 'Upload Posts'}
                        </button>
                    </div>

                    <div className={style.tableWrapper}>
                        <table className={style.table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Topic</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentPosts.map((r, i) => (
                                    <tr key={indexOfFirstPost + i}>
                                        <td data-label="ID">{r.ID}</td>
                                        <td data-label="Date">{r.Date}</td>
                                        <td data-label="Time">{r.Time}</td>
                                        <td data-label="Topic" className={style.topicCell}>
                                            {r.contentTopic}
                                        </td>
                                        <td data-label="Status">
                                            <span className={style.statusBadge}>Scheduled</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {sheetData.length > postPerPage && (
                            <Pagination
                                totalPosts={sheetData.length}
                                postPerPage={postPerPage}
                                currentPage={currentPage}
                                setCurrentPage={setCurrentPage}
                            />
                        )}
                    </div>
                </div>
            )}

            {sheetData.length === 0 && existingCount === 0 && (
                <div className={style.emptyState}>
                    <FaUpload className={style.emptyIcon} />
                    <h3>No posts scheduled</h3>
                    <p>Upload a file to schedule your posts</p>
                </div>
            )}
        </div>
    );
};

export default Uploads;