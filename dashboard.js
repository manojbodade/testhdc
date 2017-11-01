var ds = {};
ds.loading = ko.observable(true)
ds.dataloading = ko.observable(false)
ds.detailloading = ko.observable(false)
ds.detailedpage = ko.observable(false)
ds.tab = ko.observable('tab1')
ds.serverhistory = ko.observable(false)
ds.apphistory = ko.observable(false)
ds.subshistory = ko.observable(false)
ds.latencyChecked = ko.observable(true)
ds.mirrorcontinuousChecked = ko.observable(true)
ds.failedChecked = ko.observable(true)
ds.inactiveChecked = ko.observable(true)
ds.index = ko.observable('')
ds.tileList = ko.observableArray([])
ds.detailed = {
    server : ko.observable(''),
    app : ko.observable(''),
    hostname : ko.observable(''),
    serverport : ko.observable(''),
    lastsync : ko.observable(new Date()),
    purple : ko.observable(''),
    green : ko.observable(''),
    red : ko.observable(''),
    grey : ko.observable(''),

    subscription : ko.observable(''),
    source : ko.observable(''),
    target : ko.observable(''),
}
ds.applicationList = ko.observableArray([])
ds.subscriptionList = ko.observableArray([])
ds.subscriptionDetailList = ko.observableArray([])
ds.subscriptionTitleList = ko.observableArray([])
ds.historytoshow = ko.observable('Subscription Status')
ds.historytoshowList = ko.observableArray([{value:"Subscription Status",text:"Subscription Status"},
                                           {value:"Subscription Busy Tables",text:"Subscription Busy Tables"},
                                           {value:"Subscription Latency",text:"Subscription Latency"},
                                           {value:"Subscription DDL Changes",text:"Subscription DDL Changes"},
                                           // {value:"Subscription Latency per Application",text:"Subscription Latency per Application"},
                                        ])
ds.historymode = ko.observable('Frequency Cycle')
ds.historymodeList = ko.observableArray([{value:"Frequency Cycle",text:"Frequency Cycle"},
                                         {value:"Daily",text:"Daily"},
                                         {value:"Weekly",text:"Weekly"},
                                        ])
ds.selectortop = ko.observable('5')
ds.selectortopList = ko.observableArray([{value:"5",text:"5"},
                                         {value:"10",text:"10"},
                                         {value:"15",text:"15"},
                                        ])
ds.serverstartdate = ko.observable(kendo.toString(new Date(moment().subtract(1, 'month').calendar()), "yyyy-MM-dd"))
ds.serverenddate = ko.observable(kendo.toString(new Date(), "yyyy-MM-dd HH:mm:ss"))
ds.subsstartdate = ko.observable(kendo.toString(new Date(moment().subtract(1, 'month').calendar()), "yyyy-MM-dd"))
ds.subsenddate = ko.observable(kendo.toString(new Date(), "yyyy-MM-dd HH:mm:ss"))
ds.min = ko.observable(0)
ds.minThirty = ko.observable(false)


ds.getTiles = function(){
	var payload = {

	}
  	ajaxPost("/dashboard/gettiledata", payload, function (res) {
  		var tiles = [];
        $.each(res.data.data, function(i,v){
            // for (i = 0; i < 8; i++) {
                tiles.push(v)
            // }
        });
        ds.tileList(tiles);
  		ds.loading(false)
  	})
}

ds.detailPage = function(index){
    ds.index(index)
    ds.forDetail(index)
    ds.detailloading(true)
	ds.detailed.hostname(ds.tileList()[index].Server)
	ds.detailed.serverport(ds.tileList()[index].Port)
	ds.detailed.lastsync(ds.tileList()[index].LastSync)

	ds.detailed.server(ds.tileList()[index].Server)
	
	ds.detailed.purple(kendo.toString(ds.tileList()[index].PurpleSubsPrct, "n0"))
	ds.detailed.green(kendo.toString(ds.tileList()[index].GreenSubsPrct, "n0"))
    ds.detailed.red(kendo.toString(ds.tileList()[index].RedSubsPrct, "n0"))
	ds.detailed.grey(kendo.toString(ds.tileList()[index].GreySubsPrct, "n0"))
	
	var payload = {
		Server: ds.detailed.hostname(),
        Port: ds.detailed.serverport(),
		LastSync: kendo.toString(new Date(ds.detailed.lastsync()), "yyyy-MM-dd HH:mm:ss"),
	}
  	ajaxPost("/dashboard/getapplicationwisedata", payload, function (res) {
  		var app = [];
        $.each(res.data.data, function(i,v){
            app.push(v)
        });
        ds.applicationList(app);
        ds.detailloading(false)
        ds.serverhistory(false)
        ds.apphistory(false)
        ds.subshistory(false)
  	})
}

ds.subscriptionPage = function(app){
    ds.detailed.app(app)
    $( ".back" ).css('display','block')
    ds.tab('tab2')
    ds.detailedpage(true)
    ds.getSubscriptionData(false)
    // ds.latencyChecked(false)
}

ds.getSubscriptionData = function(latency){
    var payload = {
        Server: ds.detailed.hostname(),
        Port: ds.detailed.serverport(),
        Application: ds.detailed.app(),
        LastSync: kendo.toString(new Date(ds.detailed.lastsync()), "yyyy-MM-dd HH:mm:ss"),
    }
    $("#subscription"+ds.index()).html('')
    $("#subscription"+ds.index()).kendoGrid({
        dataSource: {
            transport: {
               read:function(option){
                    ajaxPost("/dashboard/getsubscriptionwisedata", payload, function(res){
                        var datas = res.data.data
                            datas = whereOr(datas).or({LatencyExceedThreshold:ds.latencyChecked()}).or({IsMirrorContinuous:ds.mirrorcontinuousChecked()}).or({IsFailed:ds.failedChecked()}).or({IsInactive:ds.inactiveChecked()}).end();
                        option.success(datas);
                    })
                },
                parameterMap: function(data) {
                   return JSON.stringify(data);
                },
            },
            pageSize: 10,
            schema: {
                model: {
                    fields: {
                    Subscription: { type: "string" },
                    Source: { type: "string" },
                    Target: { type: "string" },
                    Status: { type: "string" },
                    Latency_Threshold: { type: "number" },
                    Latency: { type: "number" },
                    }
                }
            }
        },
        columns: [
            { field: "Subscription", title: "Subscription Name",
              template: function(e){
                return '<a class="texttitle" onclick="ds.subscriptionDetail(\''+e.Subscription+'\',\''+e.Source+'\',\''+e.Target+'\')">'+e.Subscription+'</a>'
              }
            },
            { field: "Source", title: "Source Datasource",},
            { field: "Target", title: "Target Datastore",},
            { field: "Status", title: "Status",},
            { field: "", title: "Subscription Status",
              attributes: {
                // class: "#= Status == 'Mirror Continuous' ? 'green' : Status == 'Inactive' ? 'yellow' : 'red' #",
                class: "#= Latency_Threshold < Latency && Status == 'Mirror Continuous' ? 'purple' : Status == 'Mirror Continuous' ? 'green' : Status == 'Inactive' ? 'yellow' : 'red' #",
              },
            },
            { field: "Latency_Threshold", title: "Latency Threshold (mins)",
              attributes: {
                class: "text-center",
              },
            },
            { field: "Latency", title: "Latency (mins)",
              attributes: {
                // class: "#= Latency_Threshold < Latency ? 'pink text-center' : 'text-center' #",
                class: 'text-center',
              },
            },
        ],
        sortable: true,
        filterable: {
            extra:false, 
            operators: {
                string: {
                    contains: "Contains",
                    startswith: "Starts with",
                    eq: "Is equal to",
                    neq: "Is not equal to",
                    doesnotcontain: "Does not contain",
                    endswith: "Ends with"
                },
                /*number: {
                    eq: "Equal to",
                    neq: "Not equal to"
                },*/
            }
        },
        pageable: {
          refresh: true,
          pageSizes: true,
          buttonCount: 5
        },
        // height: 380,
    }); 
}

ds.subscriptionDetail = function(subs, source, target){
    ds.tab('tab3')
    ds.detailed.subscription(subs)
    ds.detailed.source(source)
    ds.detailed.target(target)
    var payload = {
        Server: ds.detailed.hostname(),
        Port: ds.detailed.serverport(),
        Application: ds.detailed.app(),
        Subscription: ds.detailed.subscription(),
        LastSync: kendo.toString(new Date(ds.detailed.lastsync()), "yyyy-MM-dd HH:mm:ss"),
    }
    ds.dataloading(true)
    ajaxPost("/dashboard/getsubscriptiondetail", payload, function (res) {
        var detail = [];
        $.each(res.data.data, function(i,v){
            detail.push(v)
            ds.subscriptionTitleList(v.Title)
        });
        ds.subscriptionDetailList(detail)
        ds.getSubscriptionDetail()
    })
}

ds.forDetail = function(index){
    ds.tab('tab1')
    $( ".back" ).css('display','none')
    $( ".detailedpage" ).slideUp();
    $( "#detailedpage"+index ).slideDown();
    ds.detailedpage(true)
}

ds.backToDetail = function(){
    if (ds.tab() == 'tab3') {
        ds.tab('tab2')
    }else if (ds.tab() == 'tab2') {
        ds.tab('tab1')
        $( ".back" ).css('display','none')
    }else{
    }
}

ds.closeDetail = function(){
    $( ".detailedpage" ).slideUp();
}

ds.backtoServer = function(){
    ds.serverhistory(false)
}

ds.backtoApp = function(){
    ds.apphistory(false)
}

ds.backtoSubs = function(){
    ds.subshistory(false)
}

ds.changeTab = function(parent, index){
    $('.tabs').removeClass('active')
    $('#'+parent+'-'+index).addClass('active')
}

ds.historymode.subscribe(function(newValue){
    if (ds.historymode() == 'Daily') {
        $("#serverenddatepicker"+ds.index()).kendoDatePicker({
            format: "yyyy-MM-dd",
            value: new Date(moment(ds.subsstartdate()).add(8, 'days'))
        })
        $("#subsenddatepicker"+ds.index()).kendoDatePicker({
            format: "yyyy-MM-dd",
            value: new Date(moment(ds.subsstartdate()).add(8, 'days'))
        })
    }else if (ds.historymode() == 'Weekly') {
        $("#serverenddatepicker"+ds.index()).kendoDatePicker({
            format: "yyyy-MM-dd",
            value: new Date(moment(ds.subsstartdate()).add(8, 'week'))
        })
        $("#subsenddatepicker"+ds.index()).kendoDatePicker({
            format: "yyyy-MM-dd",
            value: new Date(moment(ds.subsstartdate()).add(8, 'week'))
        })
    }else{
        $("#serverenddatepicker"+ds.index()).kendoDatePicker({
            format: "yyyy-MM-dd",
            value: new Date(ds.subsstartdate(), "yyyy-MM-dd HH:mm:ss")
        })
        $("#subsenddatepicker"+ds.index()).kendoDatePicker({
            format: "yyyy-MM-dd",
            value: new Date(ds.subsstartdate(), "yyyy-MM-dd HH:mm:ss")
        })
    }
});

ds.getSubscriptionDetail = function(){
    $('#'+ds.index()+'-0').addClass('active')
    $("#data-"+ds.index()+"-1").kendoGrid({
        dataSource: {
            transport: {
               read:function(option){
                    option.success(ds.subscriptionDetailList()[0].Activity);
                },
                parameterMap: function(data) {
                   return JSON.stringify(data);
                },
            },
            pageSize: 10,
            schema: {
                model: {
                    fields: {
                        Timestamp: { type: "date" },
                        Group: { type: "string" },
                        SubGroup: { type: "string" },
                        Activity: { type: "string" },
                        Total: { type: "number" },
                    }
                }
            }
        },
        sortable: true,
        resizable: true,
        columns: [
            { field: "Timestamp", title: "Timestamp",
              template: '#= kendo.toString(new Date(Timestamp), "yyyy-MM-dd HH:mm:ss") #'
            },
            { field: "Group", title: "Group",},
            { field: "SubGroup", title: "SubGroup",},
            { field: "Activity", title: "Activity",},
            { field: "Total", title: "Total",},
        ],
        filterable: {
            extra:false, 
            operators: {
                string: {
                    contains: "Contains",
                    startswith: "Starts with",
                    eq: "Is equal to",
                    neq: "Is not equal to",
                    doesnotcontain: "Does not contain",
                    endswith: "Ends with"
                },
                /*number: {
                    eq: "Equal to",
                    neq: "Not equal to"
                },*/
                date: {
                    gt: "After",
                    lt: "Before"
                },
            }
        },
        pageable: {
          refresh: true,
          pageSizes: true,
          buttonCount: 5
        },
        // height: 380,
    });
    $("#data-"+ds.index()+"-2").kendoGrid({
        dataSource: {
            transport: {
               read:function(option){
                    option.success(ds.subscriptionDetailList()[0].PerformanceStatistics);
                },
                parameterMap: function(data) {
                   return JSON.stringify(data);
                },
            },
            pageSize: 10,
            schema: {
                model: {
                    fields: {
                        Timestamp: { type: "date" },
                        MetricContext: { type: "string" },
                        Metric: { type: "string" },
                        Value: { type: "number" },
                    }
                }
            }
        },
        sortable: true,
        resizable: true,
        columns: [
            { field: "Timestamp", title: "Timestamp",
              template: '#= kendo.toString(new Date(Timestamp), "yyyy-MM-dd HH:mm:ss") #'
            },
            { field: "MetricContext", title: "MetricContext",},
            { field: "Metric", title: "Metric",},
            { field: "Value", title: "Value",},
        ],
        filterable: {
            extra:false, 
            operators: {
                string: {
                    contains: "Contains",
                    startswith: "Starts with",
                    eq: "Is equal to",
                    neq: "Is not equal to",
                    doesnotcontain: "Does not contain",
                    endswith: "Ends with"
                },
                /*number: {
                    eq: "Equal to",
                    neq: "Not equal to"
                },*/
                date: {
                    gt: "After",
                    lt: "Before"
                },
            }
        },
        pageable: {
          refresh: true,
          pageSizes: true,
          buttonCount: 5
        },
        // height: 380,
    });
    $("#data-"+ds.index()+"-3").kendoGrid({
        dataSource: {
            transport: {
               read:function(option){
                    option.success(ds.subscriptionDetailList()[0].Latency);
                },
                parameterMap: function(data) {
                   return JSON.stringify(data);
                },
            },
            pageSize: 10,
            schema: {
                model: {
                    fields: {
                        Timestamp: { type: "date" },
                        MetricContext: { type: "string" },
                        Metric: { type: "string" },
                        Value: { type: "number" },
                    }
                }
            }
        },
        sortable: true,
        resizable: true,
        columns: [
            { field: "Timestamp", title: "Timestamp",
              template: '#= kendo.toString(new Date(Timestamp), "yyyy-MM-dd HH:mm:ss") #'
            },
            { field: "MetricContext", title: "MetricContext",},
            { field: "Metric", title: "Metric",},
            { field: "Value", title: "Value",},
        ],
        filterable: {
            extra:false, 
            operators: {
                string: {
                    contains: "Contains",
                    startswith: "Starts with",
                    eq: "Is equal to",
                    neq: "Is not equal to",
                    doesnotcontain: "Does not contain",
                    endswith: "Ends with"
                },
                /*number: {
                    eq: "Equal to",
                    neq: "Not equal to"
                },*/
                date: {
                    gt: "After",
                    lt: "Before"
                },
            }
        },
        pageable: {
          refresh: true,
          pageSizes: true,
          buttonCount: 5
        },
        // height: 380,
    });
    $("#data-"+ds.index()+"-4").kendoGrid({
        dataSource: {
            transport: {
               read:function(option){
                    option.success(ds.subscriptionDetailList()[0].BusyTables);
                },
                parameterMap: function(data) {
                   return JSON.stringify(data);
                },
            },
            pageSize: 10,
            schema: {
                model: {
                    fields: {
                        Timestamp: { type: "date" },
                        SourceTable: { type: "string" },
                        TotalBytes: { type: "number" },
                        BusyPrct: { type: "number" },
                    }
                }
            }
        },
        sortable: true,
        resizable: true,
        resizable: true,
        columns: [
            { field: "Timestamp", title: "Timestamp",
              template: '#= kendo.toString(new Date(Timestamp), "yyyy-MM-dd HH:mm:ss") #'
            },
            { field: "SourceTable", title: "SourceTable",},
            { field: "TotalBytes", title: "TotalBytes",},
            { field: "BusyPrct", title: "BusyPrct",},
        ],
        filterable: {
            extra:false, 
            operators: {
                string: {
                    contains: "Contains",
                    startswith: "Starts with",
                    eq: "Is equal to",
                    neq: "Is not equal to",
                    doesnotcontain: "Does not contain",
                    endswith: "Ends with"
                },
                /*number: {
                    eq: "Equal to",
                    neq: "Not equal to"
                },*/
                date: {
                    gt: "After",
                    lt: "Before"
                },
            }
        },
        pageable: {
          refresh: true,
          pageSizes: true,
          buttonCount: 5
        },
        // height: 380,
    }); 
    $("#data-"+ds.index()+"-5").kendoGrid({
        dataSource: {
            transport: {
               read:function(option){
                    option.success(ds.subscriptionDetailList()[0].EventLog);
                },
                parameterMap: function(data) {
                   return JSON.stringify(data);
                },
            },
            pageSize: 10,
            schema: {
                model: {
                    fields: {
                        Timestamp: { type: "date" },
                        Data: { type: "string" },
                        Row: { type: "number" },
                        EventID: { type: "number" },
                        Type: { type: "string" },
                        Time: { type: "date" },
                        Object: { type: "string" },
                        Message: { type: "string" },
                    }
                }
            }
        },
        sortable: true,
        resizable: true,
        columns: [
            { field: "Timestamp", title: "Timestamp",
              template: '#= kendo.toString(new Date(Timestamp), "yyyy-MM-dd HH:mm:ss") #'
            },
            { field: "Data", title: "Data",},
            { field: "Row", title: "Row",},
            { field: "EventID", title: "EventID",},
            { field: "Type", title: "Type",},
            { field: "Time", title: "Time",
              template: '#= kendo.toString(new Date(Time), "yyyy-MM-dd HH:mm:ss") #'
            },
            { field: "Object", title: "Object",},
            { field: "Message", title: "Message",},
        ],
        filterable: {
            extra:false, 
            operators: {
                string: {
                    contains: "Contains",
                    startswith: "Starts with",
                    eq: "Is equal to",
                    neq: "Is not equal to",
                    doesnotcontain: "Does not contain",
                    endswith: "Ends with"
                },
                /*number: {
                    eq: "Equal to",
                    neq: "Not equal to"
                },*/
                date: {
                    gt: "After",
                    lt: "Before"
                },
            }
        },
        pageable: {
          refresh: true,
          pageSizes: true,
          buttonCount: 5
        },
        // height: 380,
    });
    $("#data-"+ds.index()+"-6").kendoGrid({
        dataSource: {
            transport: {
               read:function(option){
                    option.success(ds.subscriptionDetailList()[0].TableMappings);
                },
                parameterMap: function(data) {
                   return JSON.stringify(data);
                },
            },
            pageSize: 10,
            schema: {
                model: {
                    fields: {
                        Timestamp: { type: "date" },
                        SourceTable: { type: "string" },
                        TargetTable: { type: "string" },
                        Type: { type: "string" },
                        Method: { type: "string" },
                        Status: { type: "string" },
                        Prevent: { type: "string" },
                        Context: { type: "string" },
                    }
                }
            }
        },
        sortable: true,
        resizable: true,
        columns: [
            { field: "Timestamp", title: "Timestamp",
              template: '#= kendo.toString(new Date(Timestamp), "yyyy-MM-dd HH:mm:ss") #'
            },
            { field: "SourceTable", title: "SourceTable",},
            { field: "TargetTable", title: "TargetTable",},
            { field: "Type", title: "Type",},
            { field: "Method", title: "Method",},
            { field: "Status", title: "Status",},
            { field: "Prevent", title: "Prevent",},
            { field: "Context", title: "Context",},
        ],
        filterable: {
            extra:false, 
            operators: {
                string: {
                    contains: "Contains",
                    startswith: "Starts with",
                    eq: "Is equal to",
                    neq: "Is not equal to",
                    doesnotcontain: "Does not contain",
                    endswith: "Ends with"
                },
                date: {
                    gt: "After",
                    lt: "Before"
                },
            }
        },
        pageable: {
          refresh: true,
          pageSizes: true,
          buttonCount: 5
        },
        // height: 380,
    });
    $("#data-"+ds.index()+"-7").kendoGrid({
        dataSource: {
            transport: {
               read:function(option){
                    option.success(ds.subscriptionDetailList()[0].DDLChanges);
                },
                parameterMap: function(data) {
                   return JSON.stringify(data);
                },
            },
            pageSize: 10,
            schema: {
                model: {
                    fields: {
                        Timestamp: { type: "date" },
                        SourceTable: { type: "string" },
                        TargetTable: { type: "string" },
                        Type: { type: "string" },
                        Method: { type: "string" },
                        Status: { type: "string" },
                        Prevent: { type: "string" },
                        Context: { type: "string" },
                    }
                }
            }
        },
        sortable: true,
        resizable: true,
        columns: [
            { field: "Timestamp", title: "Timestamp",
              template: '#= kendo.toString(new Date(Timestamp), "yyyy-MM-dd HH:mm:ss") #'
            },
            { field: "SourceTable", title: "SourceTable",},
            { field: "TargetTable", title: "TargetTable",},
            { field: "Type", title: "Type",},
            { field: "Method", title: "Method",},
            { field: "Status", title: "Status",},
            { field: "Prevent", title: "Prevent",},
            { field: "Context", title: "Context",},
        ],
        filterable: {
            extra:false, 
            operators: {
                string: {
                    contains: "Contains",
                    startswith: "Starts with",
                    eq: "Is equal to",
                    neq: "Is not equal to",
                    doesnotcontain: "Does not contain",
                    endswith: "Ends with"
                },
                date: {
                    gt: "After",
                    lt: "Before"
                },
            }
        },
        pageable: {
          refresh: true,
          pageSizes: true,
          buttonCount: 5
        },
        // height: 380,
    });
    ds.dataloading(false)
}

ds.viewServerHistory = function(){
    ds.serverhistory(true)
    ds.getServerHistoryData()
    $("#serverstartdatepicker"+ds.index()).kendoDatePicker({
        format: "yyyy-MM-dd",
    })
    $("#serverenddatepicker"+ds.index()).kendoDatePicker({
        format: "yyyy-MM-dd",
    })
    $("#serverdatepicker"+ds.index()).kendoDatePicker({
        format: "yyyy-MM-dd",
    })
}

ds.getServerHistoryData = function(){
    var payload = {
        Server: ds.detailed.hostname(),
        Port: ds.detailed.serverport(),
        // Application: ds.detailed.app(),
        // Subscription: ds.detailed.subscription(),
        LastSync: kendo.toString(new Date(ds.detailed.lastsync()), "yyyy-MM-dd HH:mm:ss"),
        Mode: ds.historymode(),
        StringStartDate: kendo.toString(new Date(ds.serverstartdate()), "yyyy-MM-dd 00:00:00"),
        StringEndDate: kendo.toString(new Date(ds.serverenddate()), "yyyy-MM-dd 00:00:00"),
        WhatToShow: "Access Server",
    }
    if (ds.historymode() == 'Daily') {
        payload.StringEndDate = kendo.toString(new Date(moment(ds.serverstartdate()).add(8, 'days')), "yyyy-MM-dd 00:00:00")
    }else if (ds.historymode() == 'Weekly') {
        payload.StringEndDate = kendo.toString(new Date(moment(ds.serverstartdate()).add(8, 'week')), "yyyy-MM-dd 00:00:00")
    }else{
        payload.StringEndDate = kendo.toString(new Date(ds.serverstartdate()), "yyyy-MM-dd 00:00:00")
    }

    ajaxPost("/dashboard/gethistory", payload, function (res) {
        if (ds.historymode() == 'Daily') {
            var res = _.sortBy(res.data.linedata, 'category')
            ds.serverHistoryDatanonFreq(res,'count', 'Date', 'Access Server', -50)
        }else if (ds.historymode() == 'Weekly') {
            var res = _.sortBy(res.data.linedata, 'category')
            ds.serverHistoryDatanonFreq(res,'count', 'Week', 'Access Server', 0)
        }else{
            var res = _.sortBy(res.data.linedata, 'time')
            ds.serverHistoryData(res)
        }
    })
}

ds.serverHistoryData = function(res){
    $("#serverchart"+ds.index()).html('')
    $("#serverchart"+ds.index()).kendoChart({
        dataSource: {
            data:res,
            dataType: "json"
        },
        legend: {
            visible: false
        },
        chartArea: {
            background: ""
        },
        seriesDefaults: {
            type: "line",
            style: "smooth"
        },
        series: [{
            field: "status_number",
        }],
        valueAxis: {
            majorUnit: 1,
            minorUnit: 1,
            majorTicks: {
                visible: false
            },
            labels: {
                visible: true,
                template: "#= changeLabels(value) #"
            },
            line: {
                visible: true
            },
        },
        categoryAxis: {
            field: "time",
            labels: {
                rotation: -50
            },
        },
        tooltip: {
            visible: false,
            template: "#= series.name #: #= value #"
        }
    });
}

ds.serverHistoryDatanonFreq = function(res, field, categorytitle, valuetitle, rotate){
    $("#serverchart"+ds.index()).html('')
    $("#serverchart"+ds.index()).kendoChart({
        dataSource: {
            data:res,
            dataType: "json"
        },
        legend: {
            position: "bottom"
        },
        chartArea: {
            background: ""
        },
        seriesDefaults: {
            type: 'line',
            style: "smooth"
        },
        series: [{
            field: field,
            name: field
        }],
        valueAxis: {
            labels: {
                visible: true,
            },
            line: {
                visible: true
            },
        },
        categoryAxis: {
            field: "category",
            labels: {
                rotation: rotate,
                step: 1
            },
            title:{
                text: categorytitle,
            },
            axisCrossingValue: [0, 100]
        },
        tooltip: {
            visible: false,
            template: "#= series.name #: #= value #"
        }
    });
}

ds.viewAppHistory = function(){
    ds.apphistory(true)
    ds.getAppHistoryData()
}

ds.getAppHistoryData = function(){
    var payload = {
        Server: ds.detailed.hostname(),
        Port: ds.detailed.serverport(),
        Application: ds.detailed.app(),
        // Subscription: ds.detailed.subscription(),
        Mode: ds.historymode(),
        LastSync: kendo.toString(new Date(ds.detailed.lastsync()), "yyyy-MM-dd HH:mm:ss"),
        WhatToShow: "Subscription Latency per Application",
    }
    ajaxPost("/dashboard/gethistory", payload, function (res) {
        ds.appHistoryData(res)
    })
}

ds.appHistoryData = function(res){
    $("#lineappchart").kendoChart({
        dataSource: {
            data:res.data.linedata,
            dataType: "json"
        },
        legend: {
            visible: false
        },
        chartArea: {
            background: ""
        },
        seriesDefaults: {
            type: "line",
            style: "smooth"
        },
        series: [{
            field: "latency",
        }],
        valueAxis: {
            labels: {
                visible: true,
            },
            line: {
                visible: true
            },
        },
        categoryAxis: {
            field: "category",
        },
        tooltip: {
            visible: false,
            template: "#= series.name #: #= value #"
        }
    });
}

ds.viewSubsHistory = function(){
    $("#subsstartdatepicker"+ds.index()).kendoDatePicker({
        format: "yyyy-MM-dd",
    })
    $("#subsenddatepicker"+ds.index()).kendoDatePicker({
        format: "yyyy-MM-dd",
    })
    
    $("#subsdatepicker"+ds.index()).kendoDatePicker({
        format: "yyyy-MM-dd",
    })
    ds.subshistory(true)
    ds.getSubsHistoryData()
}

ds.getSubsHistoryData = function(){
    var payload = {
        Server: ds.detailed.hostname(),
        Port: ds.detailed.serverport(),
        Application: ds.detailed.app(),
        Subscription: ds.detailed.subscription(),
        LastSync: kendo.toString(new Date(ds.detailed.lastsync()), "yyyy-MM-dd HH:mm:ss"),
        Mode: ds.historymode(),
        WhatToShow: ds.historytoshow(),
        StringStartDate: kendo.toString(new Date(ds.subsstartdate()), "yyyy-MM-dd 00:00:00"),
        StringEndDate: kendo.toString(new Date(ds.subsenddate()), "yyyy-MM-dd 00:00:00"),
    }

    if (ds.historymode() == 'Daily') {
        payload.StringEndDate = kendo.toString(new Date(moment(ds.subsstartdate()).add(8, 'days')), "yyyy-MM-dd 00:00:00")
    }else if (ds.historymode() == 'Weekly') {
        payload.StringEndDate = kendo.toString(new Date(moment(ds.subsstartdate()).add(8, 'week')), "yyyy-MM-dd 00:00:00")
    }else{
        payload.StringEndDate = kendo.toString(new Date(ds.subsstartdate()), "yyyy-MM-dd 00:00:00")
    }

    if (ds.historytoshow() == 'Subscription Busy Tables' && ds.historymode() !== 'Frequency Cycle') {
        payload.Top = ds.selectortop()
    }

    ajaxPost("/dashboard/gethistory", payload, function (res) {
        if (ds.minThirty()) {
            ds.min(30)
        }else{
            ds.min(0)
        }
        var res = _.sortBy(res.data.linedata, 'category')
        if (ds.historytoshow() == 'Subscription Busy Tables') {
            if (ds.historymode() == 'Daily') {
                // data = []
                // max = ds.selectortop();
                // if(res.length < max){
                //     max = res.length
                // }
                // for(i=0; i<max; i++){
                //     data.push({category:res[i].category,records:res[i].records,table:res[i].table})
                // }
                ds.subsLineHistoryDataDaily(res,'records', 'Busy Tables Records', 2, 0)
            }else if (ds.historymode() == 'Weekly') {
                ds.subsLineHistoryDataWeek(res,'records', 'Busy Tables Records', 5, 0)
            }else{
                ds.subsLineHistoryData(res,'records', 'Date & Hour', 'Busy Tables Records', -50)
            }
        }else if (ds.historytoshow() == 'Subscription Latency') {
            if (ds.historymode() == 'Daily') {
                ds.subsLineHistoryDataDaily(res, 'latency', 'Latency (mins)', 30, ds.min())
            }else if (ds.historymode() == 'Weekly') {
                ds.subsLineHistoryDataWeek(res, 'latency', 'Latency (mins)', 30, ds.min())
            }else{
                ds.subsLineHistoryDataLatencyFreq(res,'threshold', 'Date & Hour', 'Latency (mins)', -50, 30, ds.min())
            }
        }else if (ds.historytoshow() == 'Subscription DDL Changes') {
            if (ds.historymode() == 'Daily') {
                ds.subsLineHistoryData(res,'alias', 'Date', 'DDL', -50)
            }else if (ds.historymode() == 'Weekly') {
                ds.subsLineHistoryData(res,'alias', 'Week', 'DDL', 0)
            }else{
                ds.subsLineHistoryData(res,'alias', 'Hours', 'DDL', 0)
            }
        }else{
            var res = _.sortBy(res, 'period')
            if (ds.historymode() == 'Daily') {
                ds.subsHistoryData(res,'Date', -50)
            }else if (ds.historymode() == 'Weekly') {
                ds.subsHistoryData(res,'Week', 0)
            }else{
                ds.subsHistoryDataFreq(res,'Date & Hour', -50)
            }
        }
    })
}

ds.subsHistoryDataFreq = function(res, categorytitle, rotate){
    $("#subschart"+ds.index()).html('')
    $("#subschart"+ds.index()).kendoChart({
        dataSource: {
            data:res,
            dataType: "json"
        },
        legend: {
            position: "bottom"
        },
        chartArea: {
            background: ""
        },
        seriesDefaults: {
            type: 'line',
            style: "smooth"
        },
        series: [{
        //     field: "status",
        //     name: "Latency > Threshold",
        //     color: "#7030a0"
        // },{
        //     field: "failed",
        //     name: "Failed",
        //     color: "red"
        // },{
        //     field: "inactive",
        //     name: "Inactive",
        //     color: "grey"
        // },{
        //     field: "mir_c",
        //     name: "Mirror Continuous",
        //     color: "#a9d18e"
            field: "status"
        },],
        valueAxis: {
            max: 5,
            majorUnit: 1,
            minorUnit: 1,
            majorTicks: {
                visible: false
            },
            labels: {
                visible: true,
                template: "#= changeSubs(value) #"
            },
            line: {
                visible: true
            },
        },
        categoryAxis: {
            field: "period",
            labels: {
                rotation: rotate
            },
            title:{
                text: categorytitle,
            },
        },
        tooltip: {
            visible: false,
            template: "#= value #"
        }
    });
}

ds.subsHistoryData = function(res, categorytitle, rotate){
    $("#subschart"+ds.index()).html('')
    $("#subschart"+ds.index()).kendoChart({
        dataSource: {
            data:res,
            dataType: "json"
        },
        legend: {
            position: "bottom"
        },
        chartArea: {
            background: ""
        },
        seriesDefaults: {
            type: 'line',
            style: "smooth"
        },
        series: [{
            field: "exceed",
            name: "Latency > Threshold",
            color: "#7030a0"
        },{
            field: "failed",
            name: "Failed",
            color: "red"
        },{
            field: "inactive",
            name: "Inactive",
            color: "grey"
        },{
            field: "mir_c",
            name: "Mirror Continuous",
            color: "#a9d18e"
        },],
        valueAxis: {
            labels: {
                visible: true,
            },
            line: {
                visible: true
            },
        },
        categoryAxis: {
            field: "period",
            labels: {
                rotation: rotate,
                step: 1
            },
            title:{
                text: categorytitle,
            },
        },
        tooltip: {
            visible: true,
            template: "#= series.name #: #= value #"
        }
    });
}

ds.subsLineHistoryData = function(res, field, categorytitle, valuetitle, rotate){
    $("#subschart"+ds.index()).html('')
    $("#subschart"+ds.index()).kendoChart({
        dataSource: {
            data:res,
            dataType: "json"
        },
        legend: {
            visible: false
        },
        chartArea: {
            background: ""
        },
        seriesDefaults: {
            type: 'line',
            style: "smooth"
        },
        series: [{
            field: field,
        }],
        valueAxis: {
            labels: {
                visible: true,
            },
            line: {
                visible: true
            },
            title:{
                text: valuetitle,
            },
        },
        categoryAxis: {
            field: "category",
            labels: {
                rotation: rotate
            },
            title:{
                text: categorytitle,
            },
        },
        tooltip: {
            visible: true,
            template: function(e){
                if (field == 'records') {
                    var tables = []
                    $.each(e.dataItem.tables, function(i,v){
                        if (i == 0) {
                            tables.push(v)
                        }else{
                            tables.push('<br/>'+v)
                        }
                    })

                    return '<tr> <td>Table Name</td><td>:</td><td>' + tables + '</td> </tr>'
                // }else{
                    // return '<tr><td>Count Latency</td><td>:</td><td>' + e.dataItem.num_latency + '</td></tr>'
                }
            },
        }
    });
}

ds.subsLineHistoryDataLatencyFreq = function(res, field, categorytitle, valuetitle, rotate, unit, min){
    $("#subschart"+ds.index()).html('')
    $("#subschart"+ds.index()).kendoChart({
        dataSource: {
            data:res,
            dataType: "json"
        },
        legend: {
            position: "bottom"
        },
        chartArea: {
            background: ""
        },
        seriesDefaults: {
            type: 'line',
            style: "smooth"
        },
        series: [{
            field: "latency",
            name: "Latency",
            title:{
                text: 'Latency',
            },
        },{
            field: field,
            name: field,
            title:{
                text: field,
            },
        }],
        valueAxis: {
            labels: {
                visible: true,
            },
            line: {
                visible: true
            },
            title:{
                text: valuetitle,
            },
            majorUnit: unit,
            labels: {
                template: function(e){
                    if (e.value > 120){
                        return '> 120'
                    }else{
                        return e.value
                    }
                }
            },
            min: min
        },
        categoryAxis: {
            field: "category",
            labels: {
                rotation: rotate
            },
            title:{
                text: categorytitle,
            },
        },
        tooltip: {
            visible: true,
            template: "#= series.name #: #= value #"
        }
    });
}

ds.subsLineHistoryDataDaily = function(res, field, title, unit, min){
    _.each(res, function(v){
        v.category = new Date(v.category);
    });

    $("#subschart"+ds.index()).html('')
    $("#subschart"+ds.index()).kendoChart({
        dataSource: res,
        seriesDefaults: {
            type: "scatter",
            markers: {
                size: 6
            }
        },
        series: [{
            xField: "category",
            yField: field,
        }],
        xAxis: {
            title: {
                text: "Date",
            }
        },
        yAxis: {
            title: {
                text: title,
            },
            labels: {
                skip: 1,
                step: 1
            },
            majorUnit: unit,
            labels: {
                template: function(e){
                    if (e.value > 120){
                        return '> 120'
                    }else{
                        return e.value
                    }
                }
            },
            min: min
        },
        tooltip: {
            visible: true,
            template: function(e){
                if (field == 'latency') {
                    return '<tr><td>Count Latency</td><td>:</td><td>' + e.dataItem.num_latency + '</td></tr>'
                }else{
                    var tables = []
                    $.each(e.dataItem.table, function(i,v){
                        if (i == 0) {
                            tables.push(v)
                        }else{
                            tables.push('<br/>'+v)
                        }
                    })

                    return '<tr> <td>Table Name</td><td>:</td><td>' + tables + '</td> </tr>'
                }
            },
        },
        legend:{
            visible:false
        }
    });
}

ds.subsLineHistoryDataWeek = function(res, field, title, unit, min){
    $("#subschart"+ds.index()).html('')
    $("#subschart"+ds.index()).kendoChart({
        dataSource: {
            data:res
        },
        seriesDefaults: {
            type: "scatter",
            markers: {
                size: 6
            }
        },
        series: [{
            xField: "category",
            yField: field,
        }],
        xAxis: {
            title: {
                text: "Week",
            }
        },
        yAxis: {
            title: {
                text: title,
            },
            labels: {
                skip: 1
            },
            majorUnit: unit,
            labels: {
                template: function(e){
                    if (e.value > 120){
                        return '> 120'
                    }else{
                        return e.value
                    }
                }
            },
            min: min
        },
        tooltip: {
            visible: true,
            template: function(e){
                if (field == 'latency') {
                    return '<tr><td>Week</td><td>:</td><td>' + e.dataItem.category + '</td></tr>'+
                    '<tr><td>Count Latency</td><td>:</td><td>' + e.dataItem.num_latency + '</td></tr>'
               }else{
                    var tables = []
                    $.each(e.dataItem.table, function(i,v){
                        if (i == 0) {
                            tables.push(v)
                        }else{
                            tables.push('<br/>'+v)
                        }
                    })

                    return '<tr><td>Week</td><td>:</td><td>' + e.dataItem.category + '</td></tr>'+
                           '<tr><td>Table Name</td><td>:</td><td>' + tables + '</td></tr>'
               }
            },
        },
        legend:{
            visible:false
        }
    });
}

var Tasks = [
    "",
    "Connected",
    "Not Connected",
    // "Inactive",
    // "Active",
    ""
 ];
function changeLabels(val){
    return Tasks[val];  
}

var Subs = [
    "",
    "Inactive",
    "Failed",
    "Mirror Continuous",
    "Latency > Threshold",
    ""
 ];
function changeSubs(val){
    return Subs[val];  
}

function whereOr(arr, condition) {
    var result = [],
        iface;

    iface =  {
        or: function(subcondition) {
            result = result.concat(_.where(arr, subcondition));
            return iface;
        },
        end: function() {
            return _.union(result);
        }
    };

    if (condition) {
        return iface.or(condition);
    }

    return iface;
}

$(function(){
	ds.getTiles()
})