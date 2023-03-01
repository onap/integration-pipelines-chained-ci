/**
 * Different functions to load pipelines and jobs from gitlab
 *
 * Description. (use period)
 *
 * @link   https://gitlab.com/Orange-OpenSource/lfn/ci_cd/chained-ci-vue/blob/master/js/lib.js
 * @file   lib.js
 * @author David Blaisonneau
 */


 /**
  * Load the pipelines
  */
function load(){
  // Load gitlab-ci and save it to configCi var
  getJson(gitlabCiFile, function(resp) {
    configCi = resp;
    // Get Gitlab project name
    loadTitle();
    // Load last pipelines
    pipelinesVue.loading = true;
    loadPipelines(0);

    setInterval(function (){
      if(pipelinesVue.timer > 0 ){
        pipelinesVue.timer = pipelinesVue.timer - 1;
      }
    }, 1000);
    updateLoop(updateTimer)
    // setInterval(() => {
    //   console.log("set refresh to "+ (updateTimer * 1000)+ "ms");
    //   updatePipelines();
    // }, updateTimer * 1000);
  });
}

function updateLoop(timer){
  // The refresh time has changed, update loop
  if(timer != pipelinesVue.actualRefresh){
    // If we had a Visibility loop, stop it
    if(pipelineRefreshId >= 0){
      console.log("stop actual refresh loop ["+pipelineRefreshId+"]")
      Visibility.stop(pipelineRefreshId);
    }
    pipelinesVue.timer = timer
    pipelinesVue.actualRefresh = timer;
    console.log("set refresh to "+ timer + "s for next update");
    pipelineRefreshId = Visibility.every(timer * 1000,
                                         function (){
      console.log("Update pipelines, then sleep for "+ timer +" seconds")
      // Update the pipelines
      updatePipelines();
      // Update the timer
      pipelinesVue.timer = timer
    });
  }


}

/**
 * Sort jobs by stage
 *
 * Get the whole list of jobs in a pipeline and return a list of stages dict
 * containing the name of the stage and the list of jobs in this stage
 *
 * @params {list} jobs    List of jobs sent by the /jobs API
 *
 * @return {list} List of {'name': 'stage name', 'jobs': []}
 */
function jobsByStages(jobs){
  stages = {};
  stagesList = stages2List(jobs)
  stagesList.forEach(function(stage){
    stages[stage]={'name': stage, 'jobs': []}})
  jobs.forEach(function(job){
    job.statusIcon = getIcon(job.status);
    stages[job.stage].jobs.push(job)
  });
  jobsByStagesList = []
  // return a list order by stage step
  stagesList.forEach(function(stage){
    jobsByStagesList.push(stages[stage])
  });
  return jobsByStagesList
}

/**
 * Get stages list from jobs list
 *
 * Get a list of stages used by the jobs
 *
 * @params {list} jobs    List of jobs sent by the /jobs API
 *
 * @return {list} List of stage names
 */
function stages2List(jobs){
  stagesList = []
  jobs.forEach(function(job) {
    if(stagesList.indexOf(job.stage) < 0){
      stagesList.push(job.stage)
    }
  })
  return stagesList
}

/**
 * Get an icon class
 *
 * Get an icon class name from a string
 *
 * @params {str} type  name of the icon to get
 *
 * @return {str} icon class
 */
function getIcon(type){
  switch(type){
    case 'failed':
      return 'fa fa-times-circle w3-text-red'
      break;
    case 'success':
      return 'fa fa-check-circle w3-text-green'
      break;
    case 'running':
      return 'fa fa-play-circle w3-text-blue'
      break;
    case 'waiting':
      return 'fa fa-pause-circle w3-text-orange'
      break;
    case 'skipped':
      return 'fa fa-dot-circle w3-text-blue-gray'
      break;
    case 'created':
      return 'fa fa-circle-notch w3-text-blue-gray'
      break;
    case 'canceled':
      return 'fa fa-stop-circle w3-text-blue-gray'
      break;
    case 'retry':
      return 'fa fa-plus-circle w3-text-orange'
      break;
    case 'stop':
      return 'fa fa-stop-circle w3-text-orange'
      break;
    default:
      return 'fa fa-question-circle'
  }
}


/**
 * Wrapper to call gitlab api
 *
 * @params {str}      project         gitlab project id
 * @params {str}      call            api function called
 * @params {function} reqOnload      function to call on load
 * @params {str}      api             base gitlab api to call
 * @params {str}      method          HTTP Method
 */
function gitlabCall(project, call, reqOnload,
                     api = gitlabApi, method = 'GET'){
  var requestURL = api+project+'/'+call;
  getJson(requestURL, reqOnload, getToken(api), method);
}

/**
 * Get a JSON from an api
 *
 * GET a json from an url and run a function on it
 *
 * @params {str}      requestURL  gitlab project id
 * @params {function} reqOnload  function to call on load
 * @params {str}      token       PRIVATE-TOKEN to add if needed (default: null)
 * @params {str}      method          HTTP Method
 */
function getJson(requestURL, reqOnload, token = null, method = 'GET'){
  var request = new XMLHttpRequest();
  request.open(method, requestURL);
  if (token){
    request.setRequestHeader('PRIVATE-TOKEN', token);
  };
  request.responseType = 'json';
  request.send();
  request.onload = function() {
    reqOnload(request.response);
  }
}

/**
 * Get the token of a gitlab API
 *
 * Get API token from auth vector depending of the url to call
 *
 * @params {string}  url   the url to call
 */
function getToken(url){
  target = url.split('/')[2]
  return authVue.tokensByTarget[target]
}

/**
 * Validate all API tokens
 *
 * Call gitlab API with a token to check it
 *  - Set VUEJS privateTokens.globalAccessGranted to boolean result of all
 *    authentications
 *  - Update privateTokens list to update the vue
 *
 * @params {list}  tokens   list of tokens from the form
 */
function validateTokens(tokens){
  tokens.forEach(function(token){
    if(token.value){
      getJson(
        requestURL = 'https://'+ token.target +
                     '/api/v4/projects/?per_page=1',
        function(resp){
          globalSuccess = true;
          success = (resp.length == 1)
          privateTokens.forEach(function(globalToken){
            if(token.target == globalToken.target){
              globalToken.accessGranted = success;
              if(success){
                globalToken.icon = getIcon('success');
              }else{
                globalToken.icon = getIcon('failed');
              }
            }
            globalSuccess = (globalSuccess && globalToken.accessGranted)
          })
          privateTokens.globalAccessGranted = globalSuccess
        },
        token.value);
      }
  });
}

/**
 * Authenticate at startup
 *
 * Recover saved tokens in localStorage and start token validation
 */
function authenticate(){
  // Try to authenticate with local token stored
  if (typeof(Storage) !== "undefined") {
    savedTokens = {}
    savedTokensList = JSON.parse(localStorage.getItem("chained_ci_tokens"));
    if(savedTokensList){
      savedTokensList.forEach(function(token){
        savedTokens[token.target] = token.value;
      })
      privateTokens.forEach(function(token){
        if(token.target in savedTokens){
          token.value = savedTokens[token.target]
        }
      });
      validateTokens(privateTokens);
    }
  } else {
    authVue.error = "No local storage, must authenticate again"
  }
}

/**
 * Just load the page title from chained-ci project name
 */
function loadTitle(){
  gitlabCall(chainedCiProjectId, '', function(resp) {
    headerVue.project = resp;
    pipelinesVue.newPipelineUrl = resp.web_url + '/pipelines/new';
  });
}

/**
 * Load pipelines of the project
 *
 * Call gitlab API to get the pipelines and prepare them
 *   - set global pipelines info
 *   - load pipeline jobs
 *   - for each job:
 *     - get the scenario names
 *     - clean jobs names
 *     - set if a job is a sub pipeline
 *
 * @params {string}  page   the page of the api to call (to load them by smal bulks)
 */
function loadPipelines(page = 1, size = pipelines_size){
  gitlabCall(chainedCiProjectId, 'pipelines?page='+page+'&per_page='+size, function(resp) {
    console.log('load page '+page+' with size '+ size)
    previous_pipelinesIds = Object.keys(pipelinesVue.pipelines);
    previous_sorted_pipelinesIds = pipelinesVue.sortedPipelinesIds;
    pipelines = resp;
    res = {}
    // Add more info to pipelines
    pipelines.forEach(function(pipeline) {
      console.log(pipeline)
      load_it = false
      if (previous_pipelinesIds.indexOf(pipeline.id.toString()) < 0 ){
        console.log("new pipeline " + pipeline.id);
        load_it = true;
      }else if (previous_sorted_pipelinesIds.indexOf(pipeline.id.toString()) >= 0 ){
        console.log("sorted pipeline " + pipeline.id);
        load_it = true;
      }else{
        console.log("filtered existing pipeline " + pipeline.id + ", pass");
      }
      if(load_it){
        res[pipeline.id] = {};
        res[pipeline.id].id = pipeline.id;
        res[pipeline.id].status = pipeline.status;
        res[pipeline.id].statusIcon = getIcon(pipeline.status);
        res[pipeline.id].scenario = '';
        res[pipeline.id].branch = pipeline.ref;
        res[pipeline.id].details = {};
        res[pipeline.id].stages = [];
        res[pipeline.id].url = pipeline.web_url;
        // Add details
        gitlabCall(chainedCiProjectId, 'pipelines/'+pipeline.id, function(resp) {
          res[pipeline.id].details = resp;
          dt = resp.started_at.split('T');
          res[pipeline.id].date = dt[0];
          res[pipeline.id].time = dt[1].split('.')[0];
          res[pipeline.id].user = resp.user.name;
          res[pipeline.id].userAvatar = resp.user.avatar_url;
        });
        // Add jobs
        gitlabCall(chainedCiProjectId, 'pipelines/'+pipeline.id+'/jobs', function(resp) {
          jobs = resp;
          // get scenario name
          names = []
          jobs.forEach(function(job){
            if (job.name in configCi){
              if ('variables' in configCi[job.name]){
                if ('pod' in configCi[job.name].variables){
                  name = configCi[job.name].variables.pod;
                  if(!names.includes(name)){names.push(name);}
                }
              }
            }
          });
          if(names.length){
            res[pipeline.id].scenario = names.join(' + ')
          }else{
            res[pipeline.id].scenario = 'Internal'
          }

          // test if it trig another pipeline
          jobs.forEach(function(job){
            if (job.name in configCi){
              job.internal = (configCi[job.name].script[0].search('run-ci') < 0)
            }else{
              job.internal = true;
            }
            // clean jobs names and remove the scenario name in it
            if(job.name.search(res[pipeline.id].scenario)>=0){
              job.shortname = job.name.split(':').slice(0,-1).join(':')
            }else{
              job.shortname = job.name
            }
          });

          res[pipeline.id].stages = jobsByStages(jobs);
        });
      }else{
        console.log("push previous values")
        res[pipeline.id] = pipelinesVue.pipelines[pipeline.id]
      }
    });
    pipelinesVue.pipelines = Object.assign({}, pipelinesVue.pipelines, res)
    pipelinesVue.pipelinesIds = Object.keys(pipelinesVue.pipelines);
    pipelinesVue.loading = false;
  });
}


/**
 * Update pipeline
 *
 * This function is trigged by a setInterval() and refresh all pipelines
 *
 */
function updatePipelines(){
  // Update subpipline
  if(taskDetailsVue.pipeline.status == 'running' ){
    console.log('update task')
    loadSubPipeline(taskDetailsVue.pipeline.parentTaskId,
                    taskDetailsVue.pipeline.parentTaskName)
  }
  // Update all piplines
  loadPipelines(0, pipelinesVue.pages * pipelines_size)
}


/**
 * Run an action on a pipeline job
 *
 * Call gitlab API to get run an action on a pipeline job
 *   - set global pipelines info
 *   - load pipeline jobs
 *   - for each job:
 *     - get the scenario names
 *     - clean jobs names
 *     - set if a job is a sub pipeline
 *
 * @params {string}  action   the action to run, in ['cancel', 'retry']
 * @params {int}  jobId       the job ID
 */
function jobAction(action, jobId){
  gitlabCall(
    chainedCiProjectId,
    'jobs/'+jobId+'/'+action,
    function(resp) {
      alertVue.showModal = true;
      alertVue.title = 'Action '+ action +' on job '+ jobId;
      alertVue.message = 'Status: ' + resp.status;
      console.log(resp)

    },
    gitlabApi,
    'POST'
  )
}

/**
 * Load a sub pipeline
 *
 * Load the a pipeline trigged by chained ci
 *   - Call the job logs and recover the subpipeline url
 *   - Load the pipeline info
 *   - Load the pipeline jobs
 *
 * @params {string}  jobId     The job ID inside a chained ci pipeline
 * @params {string}  jobName   The job Name inside a chained ci pipeline
 */
function loadSubPipeline(jobId, originalJobName){

  // Get project URL from static config
  pod = configCi[originalJobName].variables.pod;
  jobName = originalJobName.split(":")[0]
  // Load the config of this scenario
  getJson(scenarioFolder+'/host_vars/'+pod+'.json', function(scenario) {
    project = scenario.scenario_steps[jobName].project;
    // Load top config
    getJson(scenarioFolder+'/group_vars/all.json', function(all) {
      subprojectApi = all.gitlab.git_projects[project].api;
      subprojectUrl = all.gitlab.git_projects[project].url;
      // console.log(project_url);

      // Load the job log and search for the pipeline string
      var request = new XMLHttpRequest();
      requestURL = gitlabApi+chainedCiProjectId+'/jobs/'+jobId+'/trace';
      request.open('GET', requestURL);
      request.setRequestHeader('PRIVATE-TOKEN', getToken(gitlabApi) );
      request.send();
      request.onload = function() {
        log = request.response;
        regex = '\\* ' + subprojectUrl +'/pipelines/\\d+';
        regex = regex.replace(/\//g,'\\/');
        regex = regex.replace(/\:/g,'\\:');
        regex = regex.replace(/\./g,'\\.');
        regex = regex.replace(/\-/g,'\\-');
        filter = new RegExp(regex, 'm');
        m = log.match(filter);
        if (m){
          subpipelineId = m[0].split('/').slice(-1)[0];
          // List subpipeline jobs
          gitlabCall(
            '',
            'pipelines/'+ subpipelineId,
            function(pipeline) {
              taskDetailsVue.pipeline.name = project;
              taskDetailsVue.pipeline.id = subpipelineId;
              taskDetailsVue.pipeline.parentTaskId = jobId;
              taskDetailsVue.pipeline.parentTaskName = originalJobName;
              taskDetailsVue.pipeline.chainedCiFailure = false;
              taskDetailsVue.pipeline.status = pipeline.status;
              taskDetailsVue.pipeline.statusIcon = getIcon(pipeline.status);
              taskDetailsVue.pipeline.url = subprojectUrl+'/pipelines/'+subpipelineId;
              taskDetailsVue.pipeline.console = chainedCiUrl+'/-/jobs/'+jobId;
            },
            subprojectApi);
          gitlabCall(
            '',
            'pipelines/'+ subpipelineId +'/jobs',
            function(jobs) {
              jobs.forEach(function(job){
                if(job.name.search('triggered')>=0){
                  job.name = job.name.split(':').slice(0,-1).join(':')
                }
              });
              stages = jobsByStages(jobs);
              // console.log(stages);
              taskDetailsVue.pipeline.stages = stages;
              taskDetailsVue.showWaiting = false;
              taskDetailsVue.showPipeline = true;
              taskDetailsVue.chainedCiFailure = false;
            },
            subprojectApi);
          }else{
            taskDetailsVue.showWaiting = false;
            taskDetailsVue.showPipeline = false;
            taskDetailsVue.chainedCiFailure = true;
            taskDetailsVue.pipeline.name = project;
            taskDetailsVue.pipeline.status = 'failed';
            taskDetailsVue.pipeline.statusIcon = getIcon('failed');
            taskDetailsVue.pipeline.url = chainedCiUrl+'/-/jobs/'+jobId;
            taskDetailsVue.pipeline.console = chainedCiUrl+'/-/jobs/'+jobId;
          }
      }
    });
  });
}

/**
 * Change icon on mouse over
 *
 * @params {object}  target     The target object
 */
function iconMouseOver(target){
  switch(target.status){
    case 'failed':
    case 'success':
      target.statusIcon = getIcon('retry');
      break;
    case 'running':
      target.statusIcon = getIcon('stop');
      break;
  }
}

/**
 * Change icon on mouse leave
 *
 * @params {object}  target     The target object
 */
function iconMouseLeave(target){
  target.statusIcon = getIcon(target.status);
}


/**
 * Action depending on job status
 *
 * @params {string}  status     The job status
 * @params {int}  target     The job id
 */
function jobActionSwitch(status, jobId){
    switch(status){
      case 'failed':
      case 'success':
        jobAction('retry', jobId)
        break;
      case 'running':
        jobAction('cancel', jobId)
        break;
    }
}
