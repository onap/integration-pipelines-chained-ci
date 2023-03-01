// Init token we need to fetch
var privateTokens = [];
tokenTargets.forEach(function(target){
  privateTokens.push({'target': target,
                        'value': '',
                        'msg': '',
                        'icon': '',
                        'accessGranted': false})
})
pipelineRefreshId = -1;
// Start the authentication
authenticate();


/**
 * VUE for authentication form
 *
 * @data {list} privateTokens              list of token objects
 * @data {list} gitlabProfileToken        list of gitlab token to ask
 *
 * @computed {dict} tokensByTarget          dict of tokens by target
 * @computed {dict} globalAccessGranted   remove the form if all token are verified
 *
 * @methods {function} check the form by starting validateTokens
 */
var headerVue = new Vue({
    el: '#header',
    data: {project: {}}
});

/**
 * VUE for pipelines
 *
 * @data {bool} loading          lock var to avoid concurrent load
 * @data {dict} pipelines        dict of pipelines
 * @data {list} pipelinesIds    list of pipelines
 * @data {bool} accessGranted   show the pipelines
 * @data {int} pages             page indication
 *
 * @computed {list} sortedPipelinesIds      list of reverse pipelines ids
 *
 * @methods {function} job_details     load job details on click
 * @methods {function} handleScroll    load new pipelines on scroll to bottom
 */
var pipelinesVue = new Vue({
    el: '#pipelines',
    data: {
      loading: false,
      newPipelineUrl: '',
      pipelines: {},
      pipelinesIds: [],
      accessGranted: false,
      pipelineFilter: '',
      pages: 1,
      timer: updateTimer,
      actualRefresh: updateTimer * 2,
      optimizedRefresh: false,
    },
    computed: {
      sortedPipelinesIds: function() {
        filteredList = [];
        var pipelines = this.pipelines;
        var filter = this.pipelineFilter;
        this.pipelinesIds.sort().reverse().forEach(
          function(pipelineId){
            if(pipelines[pipelineId].scenario.includes(filter)){
              filteredList.push(pipelineId)
            }
          }
        );
        this.optimizedRefresh = (filteredList.length <= optimizedRefreshLevel);
        if(this.optimizedRefresh){
          updateLoop(updateTimer/2);
        }else{
          updateLoop(updateTimer);
        }
        return filteredList;
      }
    },
    methods:{
      mouseOverJob: function(job){
        iconMouseOver(job);
      },
      mouseLeaveJob: function(job){
        iconMouseLeave(job);
      },
      jobAction: function(job){
        jobActionSwitch(job.status, job.id)
      },
      jobDetails: function(event, job){
        taskDetailsVue.showModal = true;
        taskDetailsVue.showWaiting = true;
        taskDetailsVue.showPipeline = false;
        loadSubPipeline(job.id, job.name);
      },
      loadMore: function() {
        if (!pipelinesVue.loading){
          pipelinesVue.loading = true;
          pipelinesVue.pages += 1;
          loadPipelines(pipelinesVue.pages);
        }
      },
  }
});

// Vue.directive('scroll', {
//   inserted: function(el, binding) {
//     let f = function(evt) {
//       if (binding.value(evt, el)) {}
//     };
//     window.addEventListener('scroll', f);
//   },
// });

/**
 * VUE for authentication form
 *
 * @data {list} privateTokens              list of token objects
 * @data {list} gitlabProfileToken        list of gitlab token to ask
 *
 * @computed {dict} tokensByTarget          dict of tokens by target
 * @computed {dict} globalAccessGranted   remove the form if all token are verified
 *
 * @methods {function} check the form by starting validateTokens
 */
var authVue = new Vue({
    el: '#auth',
    data: {privateTokens: privateTokens,
           gitlabProfileToken: gitlabProfileToken},
    methods:{
      checkForm: function (e) {
        validateTokens(this.privateTokens);
        e.preventDefault();
      }
    },
    computed: {
      tokensByTarget: function() {
        tokens = {}
        this.privateTokens.forEach(function(token){
          tokens[token.target] = token.value
        });
        return tokens
      },
      globalAccessGranted: function() {
        granted = true;
        this.privateTokens.forEach(function(token){
          granted = (granted && token.accessGranted)
        });
        if (granted){
          localStorage.setItem("chained_ci_tokens", JSON.stringify(this.privateTokens));
          load()
        }
        pipelinesVue.accessGranted = granted
        return granted;
      }
    }
});

/**
 * VUE for the detail of a job (show the sub pipeline)
 *
 * @data {bool} showModal          show the modal vue
 * @data {bool} showPipeline       show the pipeline
 * @data {bool} showWaiting        show the waiting message
 * @data {bool} chainedCiFailure prompt a message of chained ci failed
 * @data {dict} pipeline           pipeline data
 */
var taskDetailsVue = new Vue({
    el: '#task_details',
    data: {
      showModal: false,
      showPipeline: false,
      showWaiting: false,
      chainedCiFailure: false,
      pipeline: {
        'name': '',
        'url': '',
        'id': '',
        'status': '',
        'statusIcon': '',
        'console': '',
        'stages': [],
        'parentTaskId': '',
        'parentTaskName': '',
      }
    },
    methods:{
      mouseOverPipeline: function(pipeline){
        iconMouseOver(pipeline);
      },
      mouseLeavePipeline: function(pipeline){
        iconMouseLeave(pipeline);
      },
      jobAction: function(pipeline){
        console.log(pipeline)
        this.showModal = false;
        this.showPipeline = false;
        jobActionSwitch(pipeline.status, pipeline.parentTaskId)
      }
    }
});

/**
 * VUE for alert
 *
 * @data {bool} showModal          show the modal vue
 * @data {bool} showPipeline       show the pipeline
 * @data {bool} showWaiting        show the waiting message
 * @data {bool} chainedCiFailure prompt a message of chained ci failed
 * @data {dict} pipeline           pipeline data
 */
var alertVue = new Vue({
    el: '#alert',
    data: {
      showModal: false,
      title: '',
      message: '',
    }
});

// Modal template
Vue.component('modal', {
  template: '#modal-template',
  methods:{
    closeModal: function(event, emit){
      if(event.target.className == 'modal-wrapper'){
        // emit('close')
        alertVue.showModal = false
        alertVue.title = ''
        alertVue.message = ''
        taskDetailsVue.showModal = false
        taskDetailsVue.showPipeline = false
        taskDetailsVue.showWaiting = false
        taskDetailsVue.chainedCiFailure = false
        taskDetailsVue.pipeline = {
          'name': '',
          'url': '',
          'id': '',
          'status': '',
          'statusIcon': '',
          'console': '',
          'stages': [],
          'parentTaskId': '',
          'parentTaskName': '',
        }
        updatePipelines
      }
    },
  },
})
