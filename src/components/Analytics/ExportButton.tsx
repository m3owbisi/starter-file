"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, FileText, FileSpreadsheet, ChevronDown, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportButtonProps {
  metrics?: string;
  dateRange?: number;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  metrics = "uploads",
  dateRange = 30,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<"csv" | "pdf" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const downloadCSV = async () => {
    try {
      setLoading("csv");
      const params = new URLSearchParams({
        format: "csv",
        metrics,
        dateRange: dateRange.toString(),
      });

      const response = await fetch(`/api/analytics/export?${params}`);
      
      if (!response.ok) throw new Error("export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${metrics}_analytics_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("error downloading csv:", error);
    } finally {
      setLoading(null);
      setIsOpen(false);
    }
  };

  const downloadPDF = async () => {
    try {
      setLoading("pdf");
      const params = new URLSearchParams({
        format: "json",
        metrics,
        dateRange: dateRange.toString(),
      });

      const response = await fetch(`/api/analytics/export?${params}`);
      const result = await response.json();

      if (!result.success) throw new Error("export failed");

      const { data } = result;
      
      // create pdf
      const doc = new jsPDF();
      
      // title
      doc.setFontSize(18);
      doc.setTextColor(60, 80, 224);
      doc.text(`proteinbind analytics report`, 14, 20);
      
      // subtitle
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`${data.metrics} analytics - ${data.dateRange}`, 14, 28);
      doc.text(`generated: ${new Date(data.generatedAt).toLocaleDateString()}`, 14, 34);
      
      // table
      autoTable(doc, {
        head: [data.headers.map((h: string) => h.replace(/_/g, " "))],
        body: data.rows.map((row: any) => data.headers.map((h: string) => row[h])),
        startY: 42,
        headStyles: {
          fillColor: [60, 80, 224],
          textColor: 255,
          fontSize: 10,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 9,
          textColor: 50,
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        margin: { left: 14, right: 14 },
      });
      
      // footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `page ${i} of ${pageCount} | proteinbind analytics`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }
      
      // download
      doc.save(`${data.filename}.pdf`);
    } catch (error) {
      console.error("error downloading pdf:", error);
    } finally {
      setLoading(null);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || loading !== null}
        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all lowercase ${
          disabled
            ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-[#3c50e0] to-[#5b6fed] text-white hover:from-[#3345c7] hover:to-[#4a5ed6] shadow-lg hover:shadow-xl"
        }`}
      >
        <Download size={16} />
        <span>export</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fadeIn">
          <div className="p-2">
            <button
              onClick={downloadCSV}
              disabled={loading !== null}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors lowercase"
            >
              {loading === "csv" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={16} className="text-[#10b981]" />
              )}
              <span>export as csv</span>
            </button>
            <button
              onClick={downloadPDF}
              disabled={loading !== null}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors lowercase"
            >
              {loading === "pdf" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileText size={16} className="text-[#ef4444]" />
              )}
              <span>export as pdf</span>
            </button>
          </div>
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 lowercase">
              last {dateRange} days
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
