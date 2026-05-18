package com.mahyhaker.hcm.dto;

import java.util.List;

import com.mahyhaker.hcm.model.LeaveRequest;

public class DashboardSummary {

    private long totalEmployees;
    private long totalDepartments;
    private long totalManagers;
    private long employeesWithoutManager;
    private long employeesWithoutDepartment;
    private long pendingLeaveRequests;
    private long approvedLeaveRequests;
    private long rejectedLeaveRequests;
    private List<LeaveRequest> upcomingLeaveRequests;

    public DashboardSummary(long totalEmployees,
                            long totalDepartments,
                            long totalManagers,
                            long employeesWithoutManager,
                            long employeesWithoutDepartment,
                            long pendingLeaveRequests,
                            long approvedLeaveRequests,
                            long rejectedLeaveRequests,
                            List<LeaveRequest> upcomingLeaveRequests) {
        this.totalEmployees = totalEmployees;
        this.totalDepartments = totalDepartments;
        this.totalManagers = totalManagers;
        this.employeesWithoutManager = employeesWithoutManager;
        this.employeesWithoutDepartment = employeesWithoutDepartment;
        this.pendingLeaveRequests = pendingLeaveRequests;
        this.approvedLeaveRequests = approvedLeaveRequests;
        this.rejectedLeaveRequests = rejectedLeaveRequests;
        this.upcomingLeaveRequests = upcomingLeaveRequests;
    }

    public long getTotalEmployees() {
        return totalEmployees;
    }

    public long getTotalDepartments() {
        return totalDepartments;
    }

    public long getTotalManagers() {
        return totalManagers;
    }

    public long getEmployeesWithoutManager() {
        return employeesWithoutManager;
    }

    public long getEmployeesWithoutDepartment() {
        return employeesWithoutDepartment;
    }

    public long getPendingLeaveRequests() {
        return pendingLeaveRequests;
    }

    public long getApprovedLeaveRequests() {
        return approvedLeaveRequests;
    }

    public long getRejectedLeaveRequests() {
        return rejectedLeaveRequests;
    }

    public List<LeaveRequest> getUpcomingLeaveRequests() {
        return upcomingLeaveRequests;
    }
}
