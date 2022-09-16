# Creation of an own chained-ci project

In our environment we want to use Chained-CI to automate the ONAP Lab
installation and testing.

On an own development client host:
* install ansible

```
   sudo apt-get install ansible
```

* Create a Git project (LabInstallation/chained-ci) in git.sdp.telekom.de
and checked it out.

```
   git clone git@gitlab.devops.telekom.de:tnap/onapcommunity/integrationproject/onapdeployment/chained-ci.git
```
* In my DevEnv I cloned the chained-ci example project:

~~~~
   git clone https://gitlab.com/Orange-OpenSource/lfn/ci_cd/chained-ci-examples.git
~~~~

* Copy the example code to chained-ci

~~~~
   cp -r chained-ci-examples/* chained-ci
~~~~

* Add submodules in chained-ci and checkin all

~~~~
   cd chained-ci
   git submodule add -b alpine-ansible https://gitlab.com/Orange-OpenSource/lfn/ci_cd/chained-ci-roles.git roles
   git submodule add https://gitlab.com/Orange-OpenSource/lfn/ci_cd/chained-ci-vue.git chained-ci-vue

   git add *
   ...
   git commit -a
   git push
~~~~

* Extract submodules

~~~~
   git submodule init
   git submodule update
~~~~

* Setup own chain

    * Create entry in ```pod_inventory/infrastructure``` (e.g. pod-test)
    * Add ```pod_inventory/hostvars/pod-test.yml``` file for the chain-steps and jumphost
    * Modify the ```pod_inventory/group_vars/all.yml```

* Modifications in ```pod_inventory/group_vars/all.yml```
    * add image and image_tag in runner section
    * remove not needed git_projects
    * add gitlab settings
    * create project settings
    * create a trigger token on the target project (in CI/CD settings) and copy token
    * generate encrypted trigger_token password

         ```
         echo '...password...' > .vault
         ```

         ```
         ansible-vault encrypt_string --vault-password-file .vault '...token...' --name 'trigger-token'
         ```

    * add encrypted trigger_token to all.yml


Example:
~~~~
runner:
  tags:
    - gitlab-org
  env_vars:
    CHAINED_CI_SRC: https://gitlab.devops.telekom.de/tnap/onapcommunity/integrationproject/onapdeployment/chained-ci.git
  docker_proxy:
  image: registry.gitlab.com/orange-opensource/lfn/ci_cd/docker_ansible
  image_tag: latest

gitlab:
  pipeline:
    delay: 15
  base_url: https://gitlab.devops.telekom.de
  api_url: https://gitlab.devops.telekom.de/api/v4
  private_token: "{{ lookup('env','CI_private_token') }}"

  git_projects:
    config:
      stage: config
      url: https://gitlab.devops.telekom.de/tnap/onapcommunity/integrationproject/onapdeployment/chained-ci.git
      branch: "{{ lookup('env','config_branch')|default('master', true) }}"
      path: pod_config
    cloud-infra:
      stage: infra_install
      api: https://gitlab.devops.telekom.de/api/v4/project/32660
      url: https://gitlab.devops.telekom.de/tnap/onapcommunity/integrationproject/onapdeployment/cloud-infra
      trigger_token: !vault |
        $ANSIBLE_VAULT;1.1;AES256
        66386364383232303832656238636130373430633539613566646337313164323733333138666163
        3766623563303133393231663237353633353365633063350a653231393436313961613733643036
        37393262363864393734323532383662663263663863646233366639633130323731343237653661
        6265323237306634620a376166616564663135316363333136356135613336646665386532616263
        64373537346235386438633130656363386633383337626337656234646361366263
      branch: "{{ lookup('env','cloud-infra_branch')|default('master', true) }}"
      get_artifacts: config
      pull_artifacts: 
      timeout: 300
      parameters:
        ansible_verbose: "{{ lookup('env','ansible_verbose') }}" 
~~~~

* Create .gitlab-ci.yml

~~~~
   ansible-playbook -vvv --vault-password-file ~/git/LabInstallation/chained-ci/.vault -i ./pod_inventory/inventory ./gitlab-ci-generator.yml
~~~~

* Checkin all modified files

* Add in chained-ci project CI/CD the following variables:

    ```ANSIBLE_VAULT_PASSWORD``` -> a secret for the Vault password
    
    ```CI_private_token``` -> API token to access Gitlab (see User-Settings-Access Tokens)

How to create own project pipelines:

* [DTs Chained-ci pipelines](chained-ci-pipeline.md)

