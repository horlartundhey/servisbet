import React, { useState, useEffect } from 'react';
import { businessService } from '../services/businessService';
import { adminService, type AdminDashboardData } from '../services/adminService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, MessageSquare, Eye, CheckCircle, XCircle, Clock, Flag, FileText, Image } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// Document Preview Component
function DocumentPreview({ doc }: { doc: any }) {
  const isPDF = doc.url?.includes('.pdf') || doc.type?.includes('pdf') || doc.fileName?.endsWith('.pdf');
  
  if (isPDF) {
    return (
      <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
        <FileText className="w-4 h-4 text-red-600" />
      </div>
    );
  } else {
    return (
      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center overflow-hidden">
        <img 
          src={doc.url} 
          alt="Document preview" 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to icon if image fails to load
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.innerHTML = '<svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg>';
          }}
        />
      </div>
    );
  }
}

interface ReviewDispute {
  _id: string;
  disputeType: string;
  reason: string;
  status: 'pending' | 'under_review' | 'requires_info' | 'resolved' | 'rejected' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedAt: string;
  ageInDays: number;
  business: {
    _id: string;
    businessName: string;
    businessEmail: string;
  };
  review: {
    _id: string;
    rating: number;
    comment: string;
    user: string;
    createdAt: string;
  };
  submittedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  adminResponse?: {
    reviewedBy?: {
      firstName: string;
      lastName: string;
    };
    reviewedAt?: string;
    decision?: string;
    notes?: string;
  };
  communications: Array<{
    from: 'business' | 'admin';
    fromUser: {
      firstName: string;
      lastName: string;
    };
    message: string;
    timestamp: string;
  }>;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for business verifications
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; businessId?: string; action?: 'approve' | 'reject' } | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [documentPreview, setDocumentPreview] = useState<{ open: boolean; doc?: any; business?: any } | null>(null);
  const [verifActionLoading, setVerifActionLoading] = useState(false);

  // Load pending verifications
  useEffect(() => {
    const fetchVerifications = async () => {
      setLoadingVerifications(true);
      try {
        const data = await businessService.getPendingVerifications();
        setPendingVerifications(data);
      } catch (err) {
        setPendingVerifications([]);
      } finally {
        setLoadingVerifications(false);
      }
    };
    fetchVerifications();
  }, []);

  // Approve/Reject handlers
  const handleVerifAction = async () => {
    if (!feedbackDialog?.businessId || !feedbackDialog.action) return;
    setVerifActionLoading(true);
    try {
      if (feedbackDialog.action === 'approve') {
        await businessService.approveVerification(feedbackDialog.businessId, feedbackText);
      } else {
        await businessService.rejectVerification(feedbackDialog.businessId, feedbackText);
      }
      // Refresh list
      const data = await businessService.getPendingVerifications();
      setPendingVerifications(data);
      setFeedbackDialog(null);
      setFeedbackText('');
    } catch (err) {
      // Optionally show error
    } finally {
      setVerifActionLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Access denied. Administrator privileges required.</p>
        </div>
      </div>
    );
  }

  // Admin dashboard data
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  
  // Business management data
  const [allBusinesses, setAllBusinesses] = useState<any[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [businessFilter, setBusinessFilter] = useState('all');
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);

  // Dispute management state
  const [disputes, setDisputes] = useState<ReviewDispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<ReviewDispute | null>(null);
  const [disputeFilter, setDisputeFilter] = useState('all');
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [adminResponse, setAdminResponse] = useState({
    decision: '',
    notes: '',
    internalNotes: ''
  });
  const [communicationMessage, setCommunicationMessage] = useState('');

  // Admin action handlers
  const handleUserAction = async (userId: string, action: string) => {
    try {
      console.log(`Admin ${user.firstName} ${user.lastName} performing ${action} on user ${userId}`);
      if (action === 'suspend') {
        await adminService.updateUserStatus(userId, 'suspended');
      } else if (action === 'activate') {
        await adminService.updateUserStatus(userId, 'active');
      }
      // Refresh dashboard data
      const data = await adminService.getDashboardStats();
      setDashboardData(data);
    } catch (error) {
      console.error('Error performing user action:', error);
    }
  };

  const handleBusinessAction = async (businessId: string, action: string) => {
    try {
      console.log(`Admin ${user.firstName} ${user.lastName} performing ${action} on business ${businessId}`);
      if (action === 'verify') {
        await adminService.updateBusinessStatus(businessId, { verificationStatus: 'approved' });
      } else if (action === 'unverify') {
        await adminService.updateBusinessStatus(businessId, { verificationStatus: 'unverified' });
      }
      // Refresh both dashboard data and business list
      const [dashboardData] = await Promise.all([
        adminService.getDashboardStats(),
        loadAllBusinesses()
      ]);
      setDashboardData(dashboardData);
    } catch (error) {
      console.error('Error performing business action:', error);
    }
  };

  const handleReviewAction = (reviewId: number, action: string) => {
    console.log(`Admin ${user.firstName} ${user.lastName} performing ${action} on review ${reviewId}`);
    // TODO: Implement actual API calls
  };

  // Dispute action handlers
  const handleDisputeReview = async (disputeId: string, status: string, decision: string) => {
    console.log(`Reviewing dispute ${disputeId} with status: ${status}, decision: ${decision}`);
    // TODO: Implement API call to review dispute
    // await disputeService.reviewDispute(disputeId, { status, decision, ...adminResponse });
    // loadDisputes();
  };

  const handleDisputeCommunication = async (disputeId: string) => {
    if (!communicationMessage.trim()) return;
    
    console.log(`Adding communication to dispute ${disputeId}: ${communicationMessage}`);
    // TODO: Implement API call to add communication
    // await disputeService.addCommunication(disputeId, { message: communicationMessage });
    setCommunicationMessage('');
    // loadDisputes();
  };

  const loadDisputes = async () => {
    setLoadingDisputes(true);
    try {
      // TODO: Implement actual API call
      // const response = await disputeService.getAllDisputes({ status: disputeFilter });
      // setDisputes(response.data);
      
      // Mock data for now
      setDisputes([
        {
          _id: '1',
          disputeType: 'fake_review',
          reason: 'This review appears to be fake. The reviewer has never been a customer.',
          status: 'pending',
          priority: 'medium',
          submittedAt: '2024-01-15T10:30:00Z',
          ageInDays: 2,
          business: {
            _id: 'b1',
            businessName: 'Pizza Palace',
            businessEmail: 'owner@pizzapalace.com'
          },
          review: {
            _id: 'r1',
            rating: 1,
            comment: 'Terrible food and service. Would never recommend.',
            user: 'Anonymous',
            createdAt: '2024-01-14T15:00:00Z'
          },
          submittedBy: {
            _id: 'u1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@pizzapalace.com'
          },
          communications: []
        },
        {
          _id: '2',
          disputeType: 'inappropriate',
          reason: 'Contains inappropriate language and personal attacks against staff.',
          status: 'under_review',
          priority: 'high',
          submittedAt: '2024-01-14T09:00:00Z',
          ageInDays: 3,
          business: {
            _id: 'b2',
            businessName: 'Tech Solutions Inc',
            businessEmail: 'admin@techsolutions.com'
          },
          review: {
            _id: 'r2',
            rating: 1,
            comment: 'The staff here are incompetent idiots who wasted my time.',
            user: 'User123',
            createdAt: '2024-01-13T14:30:00Z'
          },
          submittedBy: {
            _id: 'u2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@techsolutions.com'
          },
          adminResponse: {
            reviewedBy: {
              firstName: 'Admin',
              lastName: 'User'
            },
            reviewedAt: '2024-01-15T11:00:00Z',
            decision: 'remove_review',
            notes: 'Review contains inappropriate language and will be removed.'
          },
          communications: [
            {
              from: 'business',
              fromUser: { firstName: 'Jane', lastName: 'Smith' },
              message: 'This review contains personal attacks which violate community guidelines.',
              timestamp: '2024-01-14T09:15:00Z'
            }
          ]
        }
      ]);
    } catch (error) {
      console.error('Error loading disputes:', error);
    } finally {
      setLoadingDisputes(false);
    }
  };



  const [pendingReviews] = useState([
    { id: 1, business: 'Tech Solutions Inc', reviewer: 'Alice Brown', rating: 5, date: '2024-01-16', status: 'pending' },
    { id: 2, business: 'Green Café', reviewer: 'Bob Wilson', rating: 2, date: '2024-01-15', status: 'flagged' },
    { id: 3, business: 'Fix It Right', reviewer: 'Carol Davis', rating: 4, date: '2024-01-14', status: 'pending' },
  ]);

  // Load all businesses for management
  const loadAllBusinesses = async () => {
    setLoadingBusinesses(true);
    try {
      const params: any = { limit: 50 }; // Get more businesses for management
      if (businessFilter !== 'all') {
        params.status = businessFilter;
      }
      const response = await adminService.getBusinesses(params);
      setAllBusinesses(response.data);
    } catch (error) {
      console.error('Error loading businesses:', error);
      setAllBusinesses([]);
    } finally {
      setLoadingBusinesses(false);
    }
  };

  // Load admin dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingDashboard(true);
        const data = await adminService.getDashboardStats();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoadingDashboard(false);
      }
    };

    fetchDashboardData();
    loadAllBusinesses();
    loadDisputes();
  }, [disputeFilter]);

  // Reload businesses when filter changes
  useEffect(() => {
    loadAllBusinesses();
  }, [businessFilter]);



  const flaggedContent = [
    { id: 1, type: "Review", content: "This place is terrible...", reporter: "User123", reason: "Inappropriate language" },
    { id: 2, type: "Business", content: "Fake Business Name", reporter: "User456", reason: "Fraudulent listing" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Admin Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user.firstName} {user.lastName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="default" className="px-3 py-1">
                {user.role.toUpperCase()}
              </Badge>
              <div className="text-right">
                <p className="text-sm font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">Last login: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {loadingDashboard ? '...' : (dashboardData?.overview.totalUsers || 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {loadingDashboard ? '...' : (dashboardData?.overview.totalBusinesses || 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Businesses</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {loadingDashboard ? '...' : (dashboardData?.overview.totalReviews || 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Reviews</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {loadingDashboard ? '...' : dashboardData?.overview.pendingVerifications || 0}
              </div>
              <div className="text-sm text-muted-foreground">Pending Verifications</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {loadingDashboard ? '...' : dashboardData?.overview.flaggedContent || 0}
              </div>
              <div className="text-sm text-muted-foreground">Flagged Content</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {loadingDashboard ? '...' : dashboardData?.overview.pendingDisputes || 0}
              </div>
              <div className="text-sm text-muted-foreground">Pending Disputes</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {loadingDashboard ? '...' : dashboardData?.overview.activeDisputes || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Disputes</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">

          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="verifications">Verifications</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Business Verification Tab */}
          <TabsContent value="verifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Business Verifications</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingVerifications ? (
                  <div className="py-8 text-center text-muted-foreground">Loading...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Documents</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingVerifications.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center">No pending verifications.</TableCell></TableRow>
                      ) : pendingVerifications.map((req: any) => (
                        <TableRow key={req._id}>
                          <TableCell>{req.businessName}</TableCell>
                          <TableCell>{req.owner?.firstName} {req.owner?.lastName} <br /><span className="text-xs text-muted-foreground">{req.owner?.email}</span></TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              {(req.verificationDocs || []).map((doc: any, i: number) => (
                                <div key={i} className="flex items-center space-x-2">
                                  <DocumentPreview doc={doc} />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium">{doc.type.replace('_', ' ').toUpperCase()}</p>
                                    <p className="text-xs text-gray-500">{doc.fileName || 'Document'}</p>
                                  </div>
                                  <button
                                    onClick={() => setDocumentPreview({ open: true, doc, business: req })}
                                    className="text-blue-600 hover:text-blue-800 text-xs p-1 rounded hover:bg-blue-50"
                                    title="Preview document"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{req.verificationNotes || '-'}</TableCell>
                          <TableCell><Badge variant="outline">{req.verificationStatus}</Badge></TableCell>
                          <TableCell>
                            <Button size="sm" className="mr-2" onClick={() => { setFeedbackDialog({ open: true, businessId: req._id, action: 'approve' }); setFeedbackText(''); }}>Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => { setFeedbackDialog({ open: true, businessId: req._id, action: 'reject' }); setFeedbackText(''); }}>Reject</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            {/* Feedback Dialog */}
            <Dialog open={!!feedbackDialog?.open} onOpenChange={open => { if (!open) setFeedbackDialog(null); }}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{feedbackDialog?.action === 'approve' ? 'Approve Business' : 'Reject Business'}</DialogTitle>
                </DialogHeader>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Feedback to Business Owner (optional)</label>
                  <Textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={3} placeholder="Enter feedback or reason..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setFeedbackDialog(null)}>Cancel</Button>
                  <Button onClick={handleVerifAction} loading={verifActionLoading} disabled={verifActionLoading} className={feedbackDialog?.action === 'approve' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                    {feedbackDialog?.action === 'approve' ? 'Approve' : 'Reject'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Document Preview Dialog */}
            <Dialog open={!!documentPreview?.open} onOpenChange={open => { if (!open) setDocumentPreview(null); }}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <span>Document Preview</span>
                    {documentPreview?.doc && (
                      <Badge variant="outline">{documentPreview.doc.type.replace('_', ' ').toUpperCase()}</Badge>
                    )}
                  </DialogTitle>
                </DialogHeader>
                {documentPreview?.doc && (
                  <div className="space-y-4">
                    {/* Document Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Business:</strong> {documentPreview.business?.businessName}
                        </div>
                        <div>
                          <strong>Document Type:</strong> {documentPreview.doc.type.replace('_', ' ').toUpperCase()}
                        </div>
                        <div>
                          <strong>File Name:</strong> {documentPreview.doc.fileName || 'Document'}
                        </div>
                        <div>
                          <strong>Uploaded:</strong> {new Date(documentPreview.doc.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Document Preview */}
                    <div className="border rounded-lg overflow-hidden">
                      {documentPreview.doc.url?.includes('.pdf') || documentPreview.doc.fileName?.endsWith('.pdf') ? (
                        <div className="space-y-4">
                          {/* PDF Inline Preview */}
                          <div className="w-full h-[600px] border rounded bg-white">
                            <iframe
                              src={`${documentPreview.doc.url}#toolbar=1&navpanes=1&scrollbar=1`}
                              className="w-full h-full rounded"
                              title="PDF Preview"
                              onError={() => {
                                console.error('Failed to load PDF inline');
                              }}
                            />
                          </div>
                          
                          {/* PDF Controls */}
                          <div className="flex justify-center space-x-3">
                            <a
                              href={documentPreview.doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Open in New Tab
                            </a>
                            <a
                              href={documentPreview.doc.url.includes('cloudinary.com') 
                                ? documentPreview.doc.url.replace('/upload/', `/upload/fl_attachment:${encodeURIComponent(documentPreview.doc.fileName)}/`)
                                : documentPreview.doc.url
                              }
                              download={documentPreview.doc.fileName}
                              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download PDF
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <img
                            src={documentPreview.doc.url}
                            alt={`${documentPreview.doc.type} document`}
                            className="max-w-full max-h-96 mx-auto object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'bg-gray-100 p-8 text-center';
                              errorDiv.innerHTML = `
                                <div class="text-gray-400 mb-4">
                                  <svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
                                  </svg>
                                </div>
                                <p class="text-gray-600 mb-4">Unable to preview image</p>
                                <a href="${documentPreview.doc.url}" target="_blank" class="text-blue-600 hover:text-blue-800">View Original</a>
                              `;
                              e.currentTarget.parentElement?.appendChild(errorDiv);
                            }}
                          />
                          <div className="p-4 border-t bg-gray-50">
                            <a
                              href={documentPreview.doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Original Size
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Business: {documentPreview.business?.owner?.firstName} {documentPreview.business?.owner?.lastName} 
                        ({documentPreview.business?.owner?.email})
                      </div>
                      <div className="space-x-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700" 
                          onClick={() => {
                            setDocumentPreview(null);
                            setFeedbackDialog({ open: true, businessId: documentPreview.business?._id, action: 'approve' });
                            setFeedbackText('');
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve Business
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => {
                            setDocumentPreview(null);
                            setFeedbackDialog({ open: true, businessId: documentPreview.business?._id, action: 'reject' });
                            setFeedbackText('');
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject Business
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>User Management</CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Button variant="outline">Export</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingDashboard ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                      </TableRow>
                    ) : (
                      dashboardData?.recentActivity.recentUsers.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="default">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUserAction(user._id, 'edit')}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUserAction(user._id, 'suspend')}
                              >
                                Suspend
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) || []
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="businesses" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Business Management</CardTitle>
                <div className="flex gap-2">
                  <Select value={businessFilter} onValueChange={setBusinessFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="incomplete">Incomplete</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={loadAllBusinesses}>Refresh</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingBusinesses ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">Loading businesses...</TableCell>
                      </TableRow>
                    ) : allBusinesses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">No businesses found</TableCell>
                      </TableRow>
                    ) : (
                      allBusinesses.map((business) => (
                        <TableRow key={business._id}>
                          <TableCell className="font-medium">{business.businessName || 'N/A'}</TableCell>
                          <TableCell>
                            {business.owner ? 
                              `${business.owner.firstName} ${business.owner.lastName}` : 
                              'No owner'
                            }
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {business.owner?.email || ''}
                            </span>
                          </TableCell>
                          <TableCell>{business.businessCategory || 'Uncategorized'}</TableCell>
                          <TableCell>
                            <Badge variant={business.verificationStatus === 'approved' ? 'default' : 'secondary'}>
                              {business.verificationStatus || 'unverified'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedBusiness(business)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleBusinessAction(business._id, business.verificationStatus === 'approved' ? 'unverify' : 'verify')}
                              >
                                {business.verificationStatus === 'approved' ? 'Unverify' : 'Verify'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Business Preview Dialog */}
            <Dialog open={!!selectedBusiness} onOpenChange={open => { if (!open) setSelectedBusiness(null); }}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <span>Business Details</span>
                    {selectedBusiness && (
                      <Badge variant={selectedBusiness.verificationStatus === 'approved' ? 'default' : 'secondary'}>
                        {selectedBusiness.verificationStatus || 'unverified'}
                      </Badge>
                    )}
                  </DialogTitle>
                </DialogHeader>
                {selectedBusiness && (
                  <div className="space-y-6">
                    {/* Business Info */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2">Business Information</h3>
                          <div className="space-y-2 text-sm">
                            <div><strong>Name:</strong> {selectedBusiness.businessName || 'N/A'}</div>
                            <div><strong>Category:</strong> {selectedBusiness.businessCategory || 'Uncategorized'}</div>
                            <div><strong>Email:</strong> {selectedBusiness.businessEmail || 'N/A'}</div>
                            <div><strong>Phone:</strong> {selectedBusiness.businessPhone || 'N/A'}</div>
                            <div><strong>Website:</strong> {selectedBusiness.businessWebsite || 'N/A'}</div>
                            <div><strong>Address:</strong> {selectedBusiness.businessAddress || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2">Owner Information</h3>
                          <div className="space-y-2 text-sm">
                            <div><strong>Name:</strong> {selectedBusiness.owner ? `${selectedBusiness.owner.firstName} ${selectedBusiness.owner.lastName}` : 'N/A'}</div>
                            <div><strong>Email:</strong> {selectedBusiness.owner?.email || 'N/A'}</div>
                            <div><strong>Role:</strong> {selectedBusiness.owner?.role || 'N/A'}</div>
                            <div><strong>Joined:</strong> {selectedBusiness.createdAt ? new Date(selectedBusiness.createdAt).toLocaleDateString() : 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Business Description */}
                    {selectedBusiness.businessDescription && (
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                          {selectedBusiness.businessDescription}
                        </p>
                      </div>
                    )}

                    {/* Verification Documents */}
                    {selectedBusiness.verificationDocs && selectedBusiness.verificationDocs.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Verification Documents</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedBusiness.verificationDocs.map((doc: any, index: number) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{doc.type?.replace('_', ' ').toUpperCase()}</span>
                                <Badge variant="outline" className="text-xs">
                                  {doc.validated ? 'Validated' : 'Pending'}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div>File: {doc.fileName || 'Document'}</div>
                                <div>Size: {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Unknown'}</div>
                                <div>Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown'}</div>
                              </div>
                              {doc.url && (
                                <div className="mt-2 flex gap-2">
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View
                                  </a>
                                  <a
                                    href={doc.url.includes('cloudinary.com') 
                                      ? doc.url.replace('/upload/', '/upload/fl_attachment/')
                                      : doc.url
                                    }
                                    download={doc.fileName}
                                    className="text-green-600 hover:text-green-800 text-xs flex items-center gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Verification Notes */}
                    {selectedBusiness.verificationNotes && (
                      <div>
                        <h3 className="font-semibold mb-2">Verification Notes</h3>
                        <p className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded">
                          {selectedBusiness.verificationNotes}
                        </p>
                      </div>
                    )}

                    {/* Statistics */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedBusiness.totalReviews || 0}</div>
                        <div className="text-xs text-muted-foreground">Total Reviews</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{selectedBusiness.averageRating || 0}</div>
                        <div className="text-xs text-muted-foreground">Average Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{selectedBusiness.isActive ? 'Active' : 'Inactive'}</div>
                        <div className="text-xs text-muted-foreground">Status</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Business ID: {selectedBusiness._id}
                      </div>
                      <div className="space-x-2">
                        {selectedBusiness.verificationStatus !== 'approved' && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700" 
                            onClick={() => {
                              handleBusinessAction(selectedBusiness._id, 'verify');
                              setSelectedBusiness(null);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve Business
                          </Button>
                        )}
                        {selectedBusiness.verificationStatus === 'approved' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              handleBusinessAction(selectedBusiness._id, 'unverify');
                              setSelectedBusiness(null);
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Revoke Verification
                          </Button>
                        )}
                        <Button variant="outline" onClick={() => setSelectedBusiness(null)}>
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Review Management</CardTitle>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reviews</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">Export</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="font-medium">{review.business}</TableCell>
                        <TableCell>{review.reviewer}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
                            <span className="text-gray-300">{'★'.repeat(5 - review.rating)}</span>
                            <span className="ml-2 text-sm">({review.rating})</span>
                          </div>
                        </TableCell>
                        <TableCell>{review.date}</TableCell>
                        <TableCell>
                          <Badge variant={review.status === 'pending' ? 'secondary' : review.status === 'flagged' ? 'destructive' : 'default'}>
                            {review.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReviewAction(review.id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleReviewAction(review.id, 'reject')}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disputes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Disputes List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Review Disputes
                    </CardTitle>
                    <div className="flex gap-2">
                      <Select value={disputeFilter} onValueChange={setDisputeFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Disputes</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="under_review">Under Review</SelectItem>
                          <SelectItem value="requires_info">Requires Info</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="escalated">Escalated</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" disabled={loadingDisputes}>
                        {loadingDisputes ? 'Loading...' : 'Refresh'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Business</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {disputes.map((dispute) => (
                          <TableRow key={dispute._id}>
                            <TableCell className="font-medium">
                              <div>
                                <div className="font-semibold">{dispute.business.businessName}</div>
                                <div className="text-sm text-muted-foreground">
                                  by {dispute.submittedBy.firstName} {dispute.submittedBy.lastName}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {dispute.disputeType.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  dispute.status === 'pending' ? 'secondary' :
                                  dispute.status === 'under_review' ? 'default' :
                                  dispute.status === 'resolved' ? 'default' :
                                  dispute.status === 'escalated' ? 'destructive' : 'outline'
                                }
                              >
                                {dispute.status.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  dispute.priority === 'urgent' ? 'destructive' :
                                  dispute.priority === 'high' ? 'destructive' :
                                  dispute.priority === 'medium' ? 'default' : 'secondary'
                                }
                              >
                                {dispute.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                {dispute.ageInDays}d
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedDispute(dispute)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {dispute.status === 'pending' && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleDisputeReview(dispute._id, 'resolved', 'remove_review')}
                                    >
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleDisputeReview(dispute._id, 'rejected', 'no_action')}
                                    >
                                      <XCircle className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Dispute Details Panel */}
              <div>
                {selectedDispute ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Flag className="w-5 h-5" />
                        Dispute Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Business</h4>
                        <p className="text-sm">{selectedDispute.business.businessName}</p>
                        <p className="text-xs text-muted-foreground">{selectedDispute.business.businessEmail}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Review</h4>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-500">{'★'.repeat(selectedDispute.review.rating)}</span>
                            <span className="text-gray-300">{'★'.repeat(5 - selectedDispute.review.rating)}</span>
                            <span className="text-sm text-muted-foreground">by {selectedDispute.review.user}</span>
                          </div>
                          <p className="text-sm">{selectedDispute.review.comment}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Dispute Reason</h4>
                        <p className="text-sm">{selectedDispute.reason}</p>
                      </div>

                      {selectedDispute.adminResponse && (
                        <div>
                          <h4 className="font-semibold mb-2">Admin Response</h4>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium">Decision: {selectedDispute.adminResponse.decision}</p>
                            {selectedDispute.adminResponse.notes && (
                              <p className="text-sm mt-2">{selectedDispute.adminResponse.notes}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              by {selectedDispute.adminResponse.reviewedBy?.firstName} {selectedDispute.adminResponse.reviewedBy?.lastName}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedDispute.status === 'pending' && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">Review Dispute</h4>
                          
                          <Select 
                            value={adminResponse.decision} 
                            onValueChange={(value) => setAdminResponse({...adminResponse, decision: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select decision" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="remove_review">Remove Review</SelectItem>
                              <SelectItem value="hide_review">Hide Review</SelectItem>
                              <SelectItem value="flag_review">Flag Review</SelectItem>
                              <SelectItem value="warn_user">Warn User</SelectItem>
                              <SelectItem value="no_action">No Action</SelectItem>
                              <SelectItem value="request_more_info">Request More Info</SelectItem>
                            </SelectContent>
                          </Select>

                          <Textarea
                            placeholder="Admin notes (visible to business)"
                            value={adminResponse.notes}
                            onChange={(e) => setAdminResponse({...adminResponse, notes: e.target.value})}
                            rows={3}
                          />

                          <Textarea
                            placeholder="Internal notes (admin only)"
                            value={adminResponse.internalNotes}
                            onChange={(e) => setAdminResponse({...adminResponse, internalNotes: e.target.value})}
                            rows={2}
                          />

                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleDisputeReview(selectedDispute._id, 'resolved', adminResponse.decision)}
                              disabled={!adminResponse.decision}
                            >
                              Resolve
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => handleDisputeReview(selectedDispute._id, 'rejected', 'no_action')}
                            >
                              Reject
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => handleDisputeReview(selectedDispute._id, 'escalated', '')}
                            >
                              Escalate
                            </Button>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Communications
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {selectedDispute.communications.map((comm, index) => (
                            <div key={index} className={`p-2 rounded-lg text-sm ${
                              comm.from === 'admin' ? 'bg-blue-50 ml-4' : 'bg-gray-50 mr-4'
                            }`}>
                              <div className="font-medium text-xs text-muted-foreground mb-1">
                                {comm.fromUser.firstName} {comm.fromUser.lastName} ({comm.from})
                              </div>
                              <p>{comm.message}</p>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Textarea
                            placeholder="Add a message..."
                            value={communicationMessage}
                            onChange={(e) => setCommunicationMessage(e.target.value)}
                            rows={2}
                            className="flex-1"
                          />
                          <Button 
                            onClick={() => handleDisputeCommunication(selectedDispute._id)}
                            disabled={!communicationMessage.trim()}
                          >
                            Send
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Select a dispute to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Flagged Content</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flaggedContent.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline">{item.type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{item.content}</TableCell>
                        <TableCell>{item.reporter}</TableCell>
                        <TableCell>{item.reason}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReviewAction(item.id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleReviewAction(item.id, 'remove')}
                            >
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Advanced analytics dashboard coming soon</p>
                  <p className="text-sm text-muted-foreground">Track platform growth, user engagement, and content metrics</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;