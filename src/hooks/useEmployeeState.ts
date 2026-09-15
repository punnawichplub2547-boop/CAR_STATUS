import { useState, useEffect } from 'react';
import type { Employee, Role, EmploymentStatus } from '../types';
import {
  fetchBackendEmployees,
  createBackendEmployee,
  updateBackendEmployee,
  deleteBackendEmployee,
  getMeApi,
  getStoredToken,
  removeStoredToken,
  type EmployeePayload,
  type BackendEmployee,
} from '../utils/api';
import { INITIAL_EMPLOYEES } from '../data/mockData';
import { usePersistentState } from './usePersistentState';

const DEFAULT_AVATAR_URL =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

export function mapBackendEmployee(row: BackendEmployee, existingEmployees: Employee[]): Employee {
  const supervisorIdStr = row.supervisorId != null ? String(row.supervisorId) : undefined;
  return {
    id: String(row.id),
    empCode: row.empCode,
    name: row.name,
    email: row.email ?? '',
    department: row.department,
    section: row.section ?? '',
    position: row.position,
    startingDate: row.startingDate.slice(0, 10),
    status: row.status as EmploymentStatus,
    avatar: row.avatar ?? DEFAULT_AVATAR_URL,
    role: row.role as Role,
    supervisorId: supervisorIdStr,
    supervisorName: supervisorIdStr ? existingEmployees.find((e) => e.id === supervisorIdStr)?.name : undefined,
  };
}

export function persistCurrentUserEmpCode(empCode: string) {
  try {
    localStorage.setItem('hrskill_currentUserEmpCode', JSON.stringify(empCode));
  } catch (e) {
    console.error('Failed to save hrskill_currentUserEmpCode', e);
  }
}

export function useEmployeeState() {
  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    try {
      const raw = localStorage.getItem('hrskill_currentUserEmpCode');
      const savedEmpCode = raw ? JSON.parse(raw) : null;
      return (savedEmpCode && INITIAL_EMPLOYEES.find((e) => e.empCode === savedEmpCode)) || INITIAL_EMPLOYEES[0] || null;
    } catch {
      return INITIAL_EMPLOYEES[0] || null;
    }
  });
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = usePersistentState<boolean>('is_logged_in', false);

  useEffect(() => {
    fetchBackendEmployees()
      .then((rows) => {
        if (rows.length > 0) {
          const basicList = rows.map((r) => mapBackendEmployee(r, []));
          const mapped = basicList.map((e) => ({
            ...e,
            supervisorName: e.supervisorId ? basicList.find((x) => x.id === e.supervisorId)?.name : undefined,
          }));
          setEmployees(mapped);

          const token = getStoredToken();
          if (token) {
            getMeApi(token)
              .then((me) => {
                const userMatch = mapped.find((e) => e.empCode === me.empCode) || mapBackendEmployee(me, []);
                setCurrentUser(userMatch);
                setIsLoggedIn(true);
              })
              .catch(() => {
                removeStoredToken();
              });
          } else {
            let savedEmpCode: string | null = null;
            try {
              const raw = localStorage.getItem('hrskill_currentUserEmpCode');
              savedEmpCode = raw ? JSON.parse(raw) : null;
            } catch {
              savedEmpCode = null;
            }
            const reconciled =
              (savedEmpCode && mapped.find((e) => e.empCode === savedEmpCode)) ||
              mapped.find((e) => e.role === 'ADMIN') ||
              mapped[0] ||
              null;
            if (reconciled) setCurrentUser(reconciled);
          }
        }
      })
      .catch((err) => {
        setEmployeesError(err instanceof Error ? err.message : 'unknown error');
        // Graceful fallback to initial seed employees so app always remains fully usable
        setEmployees(INITIAL_EMPLOYEES);
        let savedEmpCode: string | null = null;
        try {
          const raw = localStorage.getItem('hrskill_currentUserEmpCode');
          savedEmpCode = raw ? JSON.parse(raw) : null;
        } catch {
          savedEmpCode = null;
        }
        const reconciled =
          (savedEmpCode && INITIAL_EMPLOYEES.find((e) => e.empCode === savedEmpCode)) ||
          INITIAL_EMPLOYEES[0] ||
          null;
        if (reconciled) setCurrentUser(reconciled);
      });
  }, [setIsLoggedIn]);

  const handleAddEmployee = (payload: EmployeePayload) => {
    createBackendEmployee(payload)
      .then((row) => setEmployees((prev) => [mapBackendEmployee(row, prev), ...prev]))
      .catch((err) => window.alert(`เพิ่มพนักงานไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`));
  };

  const handleEditEmployee = (id: string, payload: EmployeePayload) => {
    updateBackendEmployee(Number(id), payload)
      .then((row) => {
        setEmployees((prev) => {
          const updated = mapBackendEmployee(row, prev);
          return prev.map((e) => (e.id === id ? updated : e));
        });
        setCurrentUser((prev) => (prev?.id === id ? mapBackendEmployee(row, employees) : prev));
      })
      .catch((err) => window.alert(`แก้ไขพนักงานไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`));
  };

  const handleDeleteEmployee = (id: string) => {
    deleteBackendEmployee(Number(id))
      .then(() => setEmployees((prev) => prev.filter((e) => e.id !== id)))
      .catch((err) => window.alert(`ลบพนักงานไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`));
  };

  const handleSwitchUser = (user: Employee) => {
    setCurrentUser(user);
    persistCurrentUserEmpCode(user.empCode);
  };

  const handleLogout = () => {
    removeStoredToken();
    try {
      localStorage.removeItem('hrskill_currentUserEmpCode');
    } catch {}
    setIsLoggedIn(false);
  };

  const probationCount = employees.filter((e) => e.status === 'PROBATION').length;

  return {
    currentUser,
    setCurrentUser,
    employees,
    setEmployees,
    employeesError,
    isLoggedIn,
    setIsLoggedIn,
    handleAddEmployee,
    handleEditEmployee,
    handleDeleteEmployee,
    handleSwitchUser,
    handleLogout,
    persistCurrentUserEmpCode,
    probationCount,
  };
}
