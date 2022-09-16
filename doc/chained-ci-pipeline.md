# Creation of an own Project Chain

Inside of the Chained-CI project installation chains can be created
to automate the the Openstack tenant, network and VM creation, as
well as the installation of applications (e.g. ONAP)

Currently the following projects are available supporting chaining:

* cloud-infra -> Creation of Openstack tenant, network and VMs
* ...

In order to define the pipelines the following steps need to be followed:

* Projects need to be defined in all.yml (see [Chained-CI install](https://git.sdp.telekom.de/LabInstallation/chained-ci/blob/master/doc/chained-ci-install.md "Chained-CI installation"))
* in the directory chained-ci/pod_config the inventory and pod definitions
  have to be created
* in the directory chained-ci/pod_inventory the pipeline definitions
  have to be created

The execution of the pipeline requires a Jumphost within the target cloud.
Requirements for the Jumphost:
* OS: e.g. Ubuntu 18.04
* Packages: ansible, python-pip, python3-pip, jq
* Network must be able to reach and resolve the VIM Keystone interface
* To access the JH a RSA keypair needs to be created without passphrase
* The public key has to be added to the .ssh/authorized_keys of the 
  ansible user (e.g. ubuntu)
