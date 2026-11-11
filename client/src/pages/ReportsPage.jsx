import { useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import * as classApi from '../api/classApi';
import * as reportApi from '../api/reportApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import ExportMenu from '../components/ui/ExportMenu';
import { formatDate } from '../utils/formatters';
import { printReport } from '../utils/printHelper';
import { getGradeColor, getGradeBadgeVariant } from '../utils/constants';
import toast from 'react-hot-toast';

const ReportsPage = () => {
  const { settings, fetchSettings } = useSettings();
  const [classes, setClasses] = useState([]);
  const [reportType, setReportType] = useState('class');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classReport, setClassReport] = useState(null);
  const [missingReport, setMissingReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedStudentReport, setSelectedStudentReport] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const reportContentRef = useRef(null);
  const studentReportRef = useRef(null);

  useEffect(() => {
    loadClasses();
    if (!settings) {
      fetchSettings().catch((err) => console.error('Failed to fetch settings:', err));
    }
  }, []);

  const loadClasses = async () => {
    try {
      const data = await classApi.getClasses();
      setClasses(data);
    } catch (error) {
      toast.error('Failed to load classes');
    }
  };

  const classOptions = classes.map((cls) => ({
    value: cls._id,
    label: cls.className,
  }));

  const handleGenerate = async () => {
    if (!selectedClassId) {
      toast.error('Please select a class');
      return;
    }

    setLoading(true);
    try {
      if (reportType === 'missing') {
        const data = await reportApi.getMissingMarks(selectedClassId);
        setMissingReport(data);
        setClassReport(null);
      } else {
        const data = await reportApi.getClassReport(selectedClassId);
        setClassReport(data);
        setMissingReport(null);
      }
      setGenerated(true);
      toast.success('Report generated');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = async (studentId) => {
    try {
      const data = await reportApi.getStudentReport(studentId);
      setSelectedStudentReport(data);
      setShowStudentModal(true);
    } catch (error) {
      toast.error('Failed to load student report');
    }
  };

  const handlePrintReport = () => {
    const content = reportContentRef.current?.innerHTML;
    if (!content) {
      toast.error('Nothing to print');
      return;
    }

    try {
      printReport({
        content,
        settings,
        title: reportType === 'class' ? 'Class Report' : 'Missing Marks Report',
      });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handlePrintStudentReport = () => {
    const content = studentReportRef.current?.innerHTML;
    if (!content) {
      toast.error('Nothing to print');
      return;
    }

    try {
      printReport({
        content,
        settings,
        title: `Student Report - ${selectedStudentReport?.student?.fullName || ''}`,
      });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleExport = async (format) => {
    if (!selectedClassId) {
      toast.error('Generate a report first');
      return;
    }

    setExporting(true);
    try {
      if (reportType === 'class') {
        await reportApi.exportClassReport(selectedClassId, format);
      } else {
        await reportApi.exportMissingReport(selectedClassId, format);
      }
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const renderGradeBadge = (grade) => {
    if (!grade) return <span className="text-gray-400 text-xs">-</span>;
    return <Badge variant={getGradeBadgeVariant(grade)}>{grade}</Badge>;
  };

  const renderClassReport = () => {
    if (!classReport) return null;

    const { class: cls, studentReports } = classReport;
    const units = cls.units || [];

    return (
      <div ref={reportContentRef}>
        <div className="report-header">
          {settings?.logo && (
            <img
              src={settings.logo}
              alt="Logo"
              style={{ height: '50px', margin: '0 auto 8px', display: 'block' }}
            />
          )}
          <div className="school-name">{settings?.schoolName || ''}</div>
          {settings?.motto && <div className="school-motto">"{settings.motto}"</div>}
          {(settings?.address || settings?.phone) && (
            <div className="school-address">
              {[settings?.address, settings?.city, settings?.country].filter(Boolean).join(', ')}
              {settings?.phone ? ` | Tel: ${settings.phone}` : ''}
            </div>
          )}
        </div>

        <div className="report-title">Class Performance Report</div>

        <div className="report-meta">
          <span><strong>Class:</strong> {cls.className}</span>
          <span><strong>Department:</strong> {cls.departmentId?.name}</span>
          {cls.level && <span><strong>Level:</strong> {cls.level}</span>}
          <span><strong>Date:</strong> {formatDate(new Date())}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>No.</th>
                <th>Student Name</th>
                <th>Admission No.</th>
                {units.map((u) => (
                  <th key={u._id}>
                    {u.name}
                    <span className="block text-xs font-normal text-gray-500 normal-case">
                      {u.code}
                    </span>
                  </th>
                ))}
                <th>Overall</th>
                <th>Grade</th>
                <th className="print-hidden">Action</th>
              </tr>
            </thead>
            <tbody>
              {studentReports.map((report, idx) => (
                <tr key={report.student._id}>
                  <td>{idx + 1}</td>
                  <td className="font-medium">{report.student.fullName}</td>
                  <td className="text-gray-500">
                    {report.student.admissionNumber || '-'}
                  </td>
                  {units.map((unit) => {
                    const ur = report.unitResults.find(
                      (u) => u.unitId.toString() === unit._id.toString()
                    );
                    return (
                      <td key={unit._id}>
                        {ur?.missing ? (
                          <span className="text-red-600 font-semibold text-xs">-</span>
                        ) : (
                          <div>
                            <span className="font-semibold">{ur?.average ?? '-'}</span>
                            {ur?.grade && (
                              <span className={`block text-xs ${getGradeColor(ur.grade)}`}>
                                {ur.grade}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="font-bold">
                    {report.overallAverage !== null ? report.overallAverage : '-'}
                  </td>
                  <td>{renderGradeBadge(report.overallGrade)}</td>
                  <td className="print-hidden">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewStudent(report.student._id)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMissingReport = () => {
    if (!missingReport) return null;

    const { class: cls, totalStudents, missingCount, report } = missingReport;

    return (
      <div ref={reportContentRef}>
        <div className="report-header">
          {settings?.logo && (
            <img
              src={settings.logo}
              alt="Logo"
              style={{ height: '50px', margin: '0 auto 8px', display: 'block' }}
            />
          )}
          <div className="school-name">{settings?.schoolName || ''}</div>
          {settings?.motto && <div className="school-motto">"{settings.motto}"</div>}
        </div>

        <div className="report-title">Missing Marks Report</div>

        <div className="report-meta">
          <span><strong>Class:</strong> {cls.className}</span>
          <span><strong>Department:</strong> {cls.departmentId?.name}</span>
          <span><strong>Date:</strong> {formatDate(new Date())}</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded-lg">
            <p className="text-xs text-gray-500 uppercase">Total Students</p>
            <p className="text-xl font-bold">{totalStudents}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-xs text-gray-500 uppercase">With Missing Marks</p>
            <p className="text-xl font-bold text-red-600">{missingCount}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-xs text-gray-500 uppercase">Fully Recorded</p>
            <p className="text-xl font-bold text-green-600">
              {totalStudents - missingCount}
            </p>
          </div>
        </div>

        {report.length === 0 ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-800 font-medium">
              All marks recorded for this class
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Student Name</th>
                  <th>Admission No.</th>
                  <th>Missing Marks</th>
                </tr>
              </thead>
              <tbody>
                {report.map((entry, idx) => (
                  <tr key={entry.student._id}>
                    <td>{idx + 1}</td>
                    <td className="font-medium">{entry.student.fullName}</td>
                    <td className="text-gray-500">
                      {entry.student.admissionNumber || '-'}
                    </td>
                    <td>
                      {entry.missing.map((m, i) => (
                        <div key={i} className="text-xs mb-1 last:mb-0">
                          <span className="font-medium">{m.unitName}</span>
                          <span className="text-gray-500"> ({m.unitCode})</span>
                          <span className="text-red-600 ml-1">
                            - Formative{m.missingFormatives.length > 1 ? 's' : ''}{' '}
                            {m.missingFormatives.join(', ')}
                          </span>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderStudentModal = () => {
    if (!selectedStudentReport) return null;

    const { student, class: cls, unitResults, overallAverage, overallGrade } = selectedStudentReport;

    return (
      <Modal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        title={`Student Report - ${student.fullName}`}
        size="lg"
      >
        <div ref={studentReportRef}>
          <div className="report-header">
            {settings?.logo && (
              <img
                src={settings.logo}
                alt="Logo"
                style={{ height: '60px', margin: '0 auto 8px', display: 'block' }}
              />
            )}
            <div className="school-name">{settings?.schoolName || ''}</div>
            {settings?.motto && <div className="school-motto">"{settings.motto}"</div>}
          </div>

          <div className="report-title">Student Performance Report</div>

          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div>
              <p className="text-gray-500 text-xs uppercase">Student Name</p>
              <p className="font-semibold">{student.fullName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase">Admission No.</p>
              <p className="font-semibold">{student.admissionNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase">Class</p>
              <p className="font-semibold">{cls?.className || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase">Department</p>
              <p className="font-semibold">{cls?.departmentId?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase">Academic Year</p>
              <p className="font-semibold">{settings?.academicYear || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase">Date</p>
              <p className="font-semibold">{formatDate(new Date())}</p>
            </div>
          </div>

          <table className="min-w-full mb-6">
            <thead>
              <tr>
                <th>Unit</th>
                <th>Code</th>
                <th>Average</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {unitResults.map((ur) => (
                <tr key={ur.unitId}>
                  <td className="font-medium">{ur.unitName}</td>
                  <td className="text-gray-500">{ur.unitCode}</td>
                  <td className="font-semibold">
                    {ur.missing ? (
                      <span className="text-red-600 text-xs">Not Recorded</span>
                    ) : (
                      ur.average
                    )}
                  </td>
                  <td>{renderGradeBadge(ur.grade)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td colSpan={2}>Overall</td>
                <td>{overallAverage !== null ? overallAverage : '-'}</td>
                <td>{renderGradeBadge(overallGrade)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end space-x-3 mt-6 print-hidden">
          <Button variant="secondary" onClick={() => setShowStudentModal(false)}>
            Close
          </Button>
          <Button onClick={handlePrintStudentReport}>Print Report</Button>
        </div>
      </Modal>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Generate, print, and export reports</p>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Report Type"
            options={[
              { value: 'class', label: 'Class Report' },
              { value: 'missing', label: 'Missing Marks' },
            ]}
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value);
              setSelectedClassId('');
              setGenerated(false);
              setClassReport(null);
              setMissingReport(null);
            }}
          />
          <Select
            label="Select Class"
            placeholder="Select a class"
            options={classOptions}
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          />
          <div className="flex items-end">
            <Button onClick={handleGenerate} className="w-full" isLoading={loading}>
              Generate Report
            </Button>
          </div>
        </div>
      </Card>

      {loading && <Spinner size="lg" className="py-12" />}

      {generated && !loading && (
        <Card>
          <div className="flex justify-between items-center mb-4 print-hidden">
            <h2 className="text-lg font-semibold text-gray-900">
              {reportType === 'class' ? 'Class Report' : 'Missing Marks Report'}
            </h2>
            <div className="flex items-center space-x-2">
              <ExportMenu onExport={handleExport} disabled={exporting} />
              <Button variant="secondary" size="sm" onClick={handlePrintReport}>
                Print Report
              </Button>
            </div>
          </div>
          {reportType === 'class' ? renderClassReport() : renderMissingReport()}
        </Card>
      )}

      {renderStudentModal()}
    </div>
  );
};

export default ReportsPage;