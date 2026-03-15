package com.mahyhaker.hcm.dto;

import java.util.ArrayList;
import java.util.List;

public class EmployeeTreeNode {

    private Long id;
    private String name;
    private String pernr;
    private String position;
    private String department;
    private List<EmployeeTreeNode> children = new ArrayList<>();

    public EmployeeTreeNode() {
    }

    public EmployeeTreeNode(Long id, String name, String pernr, String position, String department) {
        this.id = id;
        this.name = name;
        this.pernr = pernr;
        this.position = position;
        this.department = department;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getPernr() {
        return pernr;
    }

    public String getPosition() {
        return position;
    }

    public String getDepartment() {
        return department;
    }

    public List<EmployeeTreeNode> getChildren() {
        return children;
    }

    public void setChildren(List<EmployeeTreeNode> children) {
        this.children = children;
    }
}