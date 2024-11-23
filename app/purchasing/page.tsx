"use client";

import { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef } from "ag-grid-community";
import AttachmentModal from "../components/AttachmentModal";
import { PaperClipIcon } from "@heroicons/react/24/outline";
import { refreshAccessToken } from "../dropbox/dropboxClient";

type PurchaseOrder = {
  id: number;
  jobNumber: string;
  shortDescription: string;
  vendorName: string;
  totalAmount: number;
  status: string;
  attachmentCount: number; // Make sure your backend API returns this if it doesn't already
};

export default function PurchaseOrderListPage() {
  const [rowData, setRowData] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(50); // Pagination size
  const [selectedPO, setSelectedPO] = useState<number | null>(null);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [currentAttachments, setCurrentAttachments] = useState<any[]>([]); // State to store attachments

  const columnDefs: ColDef<PurchaseOrder>[] = [
    { headerName: "Job Number", field: "jobNumber", sortable: true },
    { headerName: "Description", field: "shortDescription", sortable: true },
    { headerName: "Vendor", field: "vendorName", sortable: true },
    { headerName: "Total Amount", field: "totalAmount", sortable: true },
    { headerName: "Status", field: "status", sortable: true },
    {
      headerName: "Actions",
      field: "id",
      width: 200,
      cellRenderer: (params: any) => {
        const handleOpenAttachments = (poId: number) => {
          setSelectedPO(poId);
          openAttachmentModal(poId);
        };

        return (
          <div className="flex items-center justify-between mb-3">
            <button
              className="bg-indigo-600 px-2 py-0.75  text-white  rounded-md mr-2 mb-3"
              onClick={() =>
                (window.location.href = `/purchasing/${params.value}`)
              }
            >
              Edit
            </button>
            <button
              className="bg-red-600 px-2 py-0.75 text-white rounded-md mr-2 mb-3"
              onClick={() => handleDelete(params.value)}
            >
              Delete
            </button>

            <button
              onClick={() => handleOpenAttachments(params.value)}
              className="bg-gray-300 p-2 rounded-full hover:bg-gray-400 mb-3"
            >
              <PaperClipIcon className="h-7 w-7 text-gray-600" />
            </button>
            {params.data.attachmentCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                {params.data.attachmentCount}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  //open modal for attachments
  const openAttachmentModal = (poId: number) => {
    setSelectedPO(poId); // Set the selected purchase order ID
    setIsAttachmentModalOpen(true); // Open the attachment modal
  };

  const closeAttachmentModal = () => {
    setIsAttachmentModalOpen(false);
    setSelectedPO(null);
    setCurrentAttachments([]); // Clear attachments on close
  };

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/purchasing");
      if (!response.ok) throw new Error("Error fetching purchase orders");
      const data = await response.json();
      setRowData(data.purchaseOrders); // Assume API returns { purchaseOrders: [...] }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (poId: number) => {
    if (
      window.confirm("Are you sure you want to delete this purchase order?")
    ) {
      try {
        const response = await fetch(`/api/purchasing/${poId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Error deleting purchase order");
        loadPurchaseOrders(); // Reload the data after deletion
      } catch (err) {
        setError((err as Error).message);
      }
    }
  };

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  if (loading) return <div>Loading purchase orders...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-md shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-700">
          Purchase Orders
        </h1>
        <button
          onClick={() => (window.location.href = "/purchasing/new")}
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-100"
        >
          Add Purchase Order
        </button>
      </div>

      <div className="ag-theme-alpine" style={{ height: 600, width: "100%" }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={pageSize}
        />
      </div>

      {/* Attachment Modal */}
      {isAttachmentModalOpen && selectedPO && (
        <AttachmentModal
          isOpen={isAttachmentModalOpen}
          onClose={closeAttachmentModal}
          recordId={selectedPO ?? 0}
          tableName={"purchase_orders"}
        />
      )}
    </div>
  );
}
