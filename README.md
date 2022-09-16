Chained-CI
==========

Role
----
Chained-CI is a way to run a set of projects, each one as a job in a top level
pipeline.

This project, running on gitlab CE, is triggering configured projects one
after the other, or in parallele, sharing configuration through artifacts. This
allow to integrate projects managed by third parties, or running together
independent projects.

This project is hosting the pipelines and the pipeline configuration.
See [Orange CI Roles](https://gitlab.com/Orange-OpenSource/lfn/ci_cd/chained-ci-roles "Orange CI Roles") to see the
roles needed to run thoses pipelines

Input
-----
  - Environment variables:
    - __Required__:
      - POD:
          - role: pod name as defined in pod_inventory/inventory
          - example: pod1
          - default: none
    - Optional:
      - RUNNER_TAG:
        - override the default gitlab-runner tag (ta5_tnaplab)
        - "old" lab runner tag: tnaplab2
      - USER_ROLE:
        - overrides the name of the "member" role in Openstack
        - default role: "Member" (used in "old" DT lab)
      - AREYOUSURE:
        - role: disable the deployment protection on some pods
        - default: ''
        - values: '' or 'MAIS OUI !!!'
      - ansible_verbose:
          - role: verbose option for ansible
          - values: "", "-vvv"
          - default: ""
      - infra_branch:
          - role: the branch for project infra_manager
          - default: master
      - os_infra_branch:
          - role: the branch for project os_infra_manager
          - default: master
      - vim_branch:
          - role: the branch for the VIMs projects (kolla, k8s)
          - default: master
      - kolla_branch:
          - role: a value to pass to project kolla
          - default: 'stable/queens'
      - kolla_ansible_branch:
          - role: a value to pass to project kolla
          - default: 'stable/queens'
      - functest_branch:
          - role: the branch for project functest
          - default: master
      - acumos_branch:
          - role: the branch for project acumos-installer
          - default: master

Output
------
  - artifacts: each step can fetch the artifact generate by the sub-project as
      defined in the git_projects variables pull_artifacts

Details
-------
  - [Chained-CI intro](./doc/chained-ci-intro.md "Chained-CI intro")

Quick Guide to create a pipeline
--------------------------------
  - Reuse or create a inventory file-pair under pod_config/config
      - k8s*.yaml defining the VMs and their resource settings (RAM, Disk, CPUs)
      - idf-k8s*.yaml defining the inventory setting (tenant, network, node roles...)
  - Create pipeline definition file under pod_inventory/host_vars
  - Add name of the pipeline in pod_inventory/inventory
  - Update the submodules (git submodule init; git submodule update)
  - Run ansible script to regenerate .gitlab-ci.yaml
      - ansible-playbook -vvv --vault-password-file ./.vault -i ./pod_inventory/inventory ./gitlab-ci-generator.yml
  - (Workarround) add RUNNER_TAG default variable in .gitlab-ci.yaml
  ``` 
  variables:
  GIT_SUBMODULE_STRATEGY: recursive
  VAULT_FILE: .vault
  RUNNER_TAG: ta5_tnaplab
  ```
  - check-in code and create a pipeline 
