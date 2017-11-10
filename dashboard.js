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
    country : ko.observable(''),
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
ds.historymodeList = ko.observableArray([{value:"Frequency Cycle",text:"Last 24 Hours"},
                                         {value:"Daily",text:"Last 8 Days"},
                                         {value:"Weekly",text:"Last 8 Weeks"},
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
ds.date = ko.observableArray([])

ds.serverList = ko.observableArray([])
ds.ssindex = ko.observable('')


// cdc
ds.getCDC = function(){
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
                return '<a class="texttitle" onclick="ds.subscriptionDetail(\''+e.Subscription+'\',\''+e.Source+'\',\''+e.Target+'\',\''+e.Country+'\')">'+e.Subscription+'</a>'
              }
            },
            { field: "Source", title: "Src Datastore",},
            { field: "Target", title: "Tgt Datastore",},
            { field: "Country", title: "Country",
              attributes: {
                class: "field-ellipsis",
              },
            },
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

ds.subscriptionDetail = function(subs, source, target, country){
    ds.tab('tab3')
    ds.detailed.subscription(subs)
    ds.detailed.source(source)
    ds.detailed.target(target)
    ds.detailed.country(country)

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
            value: new Date(moment(ds.serverstartdate()).add(8, 'days'))
        })
        $("#subsenddatepicker"+ds.index()).kendoDatePicker({
            format: "yyyy-MM-dd",
            value: new Date(moment(ds.subsstartdate()).add(8, 'days'))
        })
    }else if (ds.historymode() == 'Weekly') {
        $("#serverenddatepicker"+ds.index()).kendoDatePicker({
            format: "yyyy-MM-dd",
            value: new Date(moment(ds.serverstartdate()).add(8, 'week'))
        })
        $("#subsenddatepicker"+ds.index()).kendoDatePicker({
            format: "yyyy-MM-dd",
            value: new Date(moment(ds.subsstartdate()).add(8, 'week'))
        })
    }else{
        $("#serverenddatepicker"+ds.index()).kendoDatePicker({
            format: "yyyy-MM-dd",
            value: new Date(ds.serverstartdate(), "yyyy-MM-dd HH:mm:ss")
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
                    var data = (ds.subscriptionDetailList()[0].Activity ==  []) ? [] : ds.subscriptionDetailList()[0].Activity
                    option.success(data);
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
                    var data = (ds.subscriptionDetailList()[0].PerformanceStatistics ==  []) ? [] : ds.subscriptionDetailList()[0].PerformanceStatistics
                    option.success(data);
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
                    var data = (ds.subscriptionDetailList()[0].Latency ==  []) ? [] : ds.subscriptionDetailList()[0].Latency
                    option.success(data);
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
                    var data = (ds.subscriptionDetailList()[0].BusyTables ==  []) ? [] : ds.subscriptionDetailList()[0].BusyTables
                    option.success(data);
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
                    var data = (ds.subscriptionDetailList()[0].EventLog ==  []) ? [] : ds.subscriptionDetailList()[0].EventLog
                    option.success(data);
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
                    var data = (ds.subscriptionDetailList()[0].TableMappings ==  []) ? [] : ds.subscriptionDetailList()[0].TableMappings
                    option.success(data);
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
                    var data = (ds.subscriptionDetailList()[0].DDLChanges ==  []) ? [] : ds.subscriptionDetailList()[0].DDLChanges
                    option.success(data);
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
                        Row: { type: "string" },
                        EventID: { type: "string" },
                        Type: { type: "string" },
                        Time: { type: "string" },
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

ds.viewServerHistory = function(index){
    ds.index(index)
    ds.forDetail(index)
    
    ds.detailed.hostname(ds.tileList()[index].Server)
    ds.detailed.serverport(ds.tileList()[index].Port)
    ds.detailed.lastsync(ds.tileList()[index].LastSync)

    ds.serverhistory(true)
    ds.getServerHistoryData()
    $("#serverstartdatepicker"+index).kendoDatePicker({
        format: "yyyy-MM-dd",
    })
    $("#serverenddatepicker"+index).kendoDatePicker({
        format: "yyyy-MM-dd",
    })
    $("#serverdatepicker"+index).kendoDatePicker({
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
        $("#serverenddatepicker"+ds.index()).kendoDatePicker({
            format: "yyyy-MM-dd",
            value: new Date(moment(ds.serverstartdate()).add(8, 'days'))
        })
        payload.StringEndDate = kendo.toString(new Date(moment(ds.serverstartdate()).add(8, 'days')), "yyyy-MM-dd 00:00:00")
    }else if (ds.historymode() == 'Weekly') {
        $("#serverenddatepicker"+ds.index()).kendoDatePicker({
            format: "yyyy-MM-dd",
            value: new Date(moment(ds.serverstartdate()).add(8, 'week'))
        })
        payload.StringEndDate = kendo.toString(new Date(moment(ds.serverstartdate()).add(8, 'week')), "yyyy-MM-dd 00:00:00")
    }else{
        $("#serverenddatepicker"+ds.index()).kendoDatePicker({
            format: "yyyy-MM-dd",
            value: new Date(ds.serverstartdate(), "yyyy-MM-dd HH:mm:ss")
        })
        payload.StringEndDate = kendo.toString(new Date(ds.serverstartdate()), "yyyy-MM-dd 00:00:00")
    }

    ajaxPost("/dashboard/gethistory", payload, function (res) {
        if (ds.historymode() == 'Daily') {
            var res = _.sortBy(res.data.linedata, 'category')
            ds.serverHistoryDataDaily(res)
        }else if (ds.historymode() == 'Weekly') {
            var res = _.sortBy(res.data.linedata, 'category')
            ds.serverHistoryDataWeekly(res)
        }else{
            var res = _.sortBy(res.data.linedata, 'time')
            var dates = []
            $.each(res, function(i,v){
                dates.push(v.time.split(' ')[0])
            })
            var median = dates[Math.floor(dates.length / 2)]
            ds.serverHistoryData(res, median)
        }
    })
}

ds.serverHistoryData = function(res, median){
    $("#serverchart"+ds.index()).html('')
    $("#serverchart"+ds.index()).kendoChart({
        title: {
            text: "Access Server Connection Status"
        },
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
        categoryAxis:[{
            field: "time",
            labels: {
                template: function(e){
                    var hour = e.value.split(' ')
                    var hour = hour[1].split(':')
                    return hour[0]
                }
            },
            title:{
                font: "12px Arial,Helvetica,sans-serif",
                text: median
            }
        },{
            field: "time",
            labels: {
                visible: false
            },
            line: {
                visible: false
            },
            title:{
                text: 'Hours & Date'
            }
        }],
        tooltip: {
            visible: false,
            template: "#= series.name #: #= value #"
        }
    });
}

ds.serverHistoryDataDaily = function(res){
    $("#serverchart"+ds.index()).html('')
    $("#serverchart"+ds.index()).kendoChart({
        title: {
            text: "Access Server Connection Status"
        },
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
            field: 'count',
            name: 'count'
        }],
        valueAxis: {
            labels: {
                visible: true,
            },
            title:{
                text: 'Count Connection'
            },
            line: {
                visible: true
            },
        },
        categoryAxis: {
            field: "category",
            labels: {
                rotation: -50,
                step: 1
            },
            title:{
                text: 'Date',
            },
            axisCrossingValue: [0, 100]
        },
        tooltip: {
            visible: true,
            template: "#= series.name #: #= value #"
        }
    });
}

ds.serverHistoryDataWeekly = function(res){
    $("#serverchart"+ds.index()).html('')
    $("#serverchart"+ds.index()).kendoChart({
        title: {
            text: "Access Server Connection Status"
        },
        dataSource: {
            data:res
        },
        seriesDefaults: {
            type: 'line',
            style: "smooth"
        },
        series: [{
            field: 'count',
            name: 'count'
        }],
        valueAxis: {
           title:{
                text: 'Count Connection'
            },
        },
        categoryAxis: {
            field: "weekstart",
            labels:{
                template: function(e){
                    var start = e.dataItem.weekstart.split('-')[1] +'/'+ e.dataItem.weekstart.split('-')[2];
                    var end = e.dataItem.weekend.split('-')[1] +'/'+ e.dataItem.weekend.split('-')[2];
                    return start + ' ~ ' + end
                }
            },
            title:{
                text: 'Date'
            },
        },
        tooltip: {
            visible: true,
        },
        legend:{
            visible:false
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
        $("#subsenddatepicker"+ds.index()).kendoDatePicker({
            format: "yyyy-MM-dd",
            value: new Date(moment(ds.subsstartdate()).add(8, 'days'))
        })
        payload.StringEndDate = kendo.toString(new Date(moment(ds.subsstartdate()).add(8, 'days')), "yyyy-MM-dd 00:00:00")
    }else if (ds.historymode() == 'Weekly') {
        $("#subsenddatepicker"+ds.index()).kendoDatePicker({
            format: "yyyy-MM-dd",
            value: new Date(moment(ds.subsstartdate()).add(8, 'week'))
        })
        payload.StringEndDate = kendo.toString(new Date(moment(ds.subsstartdate()).add(8, 'week')), "yyyy-MM-dd 00:00:00")
    }else{
        $("#subsenddatepicker"+ds.index()).kendoDatePicker({
            format: "yyyy-MM-dd",
            value: new Date(ds.subsstartdate(), "yyyy-MM-dd HH:mm:ss")
        })
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
                ds.subsLineHistoryDataDaily(res,'records', 'Number of Occurence', 2, 0, 'Busy Tables List')
            }else if (ds.historymode() == 'Weekly') {
                ds.subsLineHistoryDataWeek(res,'records', 'Number of Occurence', 5, 0, 'Busy Tables List')
            }else{
                var dates = []
                $.each(res, function(i,v){
                    dates.push(v.category.split(' ')[0])
                })
                var median = dates[Math.floor(dates.length / 2)]
                ds.subsLineHistoryData(res,'records', 'Busy Tables Records', 'Busy Tables List', median)
            }
        }else if (ds.historytoshow() == 'Subscription Latency') {
            if (ds.historymode() == 'Daily') {
                ds.subsLineHistoryDataLatencyDaily(res, 'value', 'Latency (mins)', 30, ds.min(), '')
            }else if (ds.historymode() == 'Weekly') {
                ds.subsLineHistoryDataLatencyWeek(res, 'value', 'Latency (mins)', 30, ds.min(), '')
            }else{
                var dates = []
                $.each(res, function(i,v){
                    dates.push(v.category.split(' ')[0])
                })
                var median = dates[Math.floor(dates.length / 2)]
                ds.subsLineHistoryDataLatencyFreq(res,'threshold', 'Latency (mins)', 30, ds.min(), '', median)
            }
        }else if (ds.historytoshow() == 'Subscription DDL Changes') {
            if (ds.historymode() == 'Daily') {
                ds.subsLineHistoryDataDaily(res,'sumDDL', 'Number of Occurence', 2, 0, 'DDL')
            }else if (ds.historymode() == 'Weekly') {
                ds.subsLineHistoryDataWeek(res,'sumDDL', 'Number of Occurence', 5, 0, 'DDL')
            }else{
                ds.subsLineHistoryData(res,'sumDDL', 'Date & Hour', 'DDL', -50, 'DDL')
            }
        }else{
            var res = _.sortBy(res, 'period')
            if (ds.historymode() == 'Daily') {
                ds.subsHistoryDataDaily(res,'Date')
            }else if (ds.historymode() == 'Weekly') {
                ds.subsHistoryDataWeek(res,'Week')
            }else{
                var dates = []
                $.each(res, function(i,v){
                    dates.push(v.period.split(' ')[0])
                })
                var median = dates[Math.floor(dates.length / 2)]
                ds.subsHistoryDataFreq(res, median)
            }
        }
    })
}

ds.subsHistoryDataFreq = function(res, median){
    $("#subschart"+ds.index()).html('')
    $("#subschart"+ds.index()).kendoChart({
        title: {
            text: "Subscription Status"
        },
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
            field: "status"
        },],
        valueAxis: {
            max: 6,
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
        categoryAxis: [{
            field: "period",
            labels: {
                rotation: 0
            },
            labels: {
                template: function(e){
                    var hour = e.value.split(' ')
                    var hour = hour[1].split(':')
                    return hour[0]
                }
            },
            title:{
                font: "12px Arial,Helvetica,sans-serif",
                text: median
            }
        },{
            field: "time",
            labels: {
                visible: false
            },
            line: {
                visible: false
            },
            title:{
                text: 'Hours & Date'
            }
        }],
        tooltip: {
            visible: false,
            template: "#= value #"
        }
    });
}

ds.subsHistoryDataDaily = function(res, categorytitle, rotate){
    $("#subschart"+ds.index()).html('')
    $("#subschart"+ds.index()).kendoChart({
        title: {
            text: "Subscription Status"
        },
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
            title:{
                text: "Count Connection"
            }
        },
        categoryAxis: {
            field: "period",
            labels: {
                rotation: -50,
                step: 1,
                template:function(e){
                    if (e.value == 0) {
                        var start = e.dataItem.weekstart.split('-')[1] +'/'+ e.dataItem.weekstart.split('-')[2];
                        var end = e.dataItem.weekend.split('-')[1] +'/'+ e.dataItem.weekend.split('-')[2];
                        return start + ' ~ ' + end
                    }else{
                        return e.value
                    }
                }
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

ds.subsHistoryDataWeek = function(res, categorytitle, rotate){
    $("#subschart"+ds.index()).html('')
    $("#subschart"+ds.index()).kendoChart({
        title: {
            text: "Subscription Status"
        },
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
            title:{
                text: "Count Connection"
            }
        },
        categoryAxis: {
            field: "weekstart",
            labels:{
                template: function(e){
                    var start = e.dataItem.weekstart.split('-')[1] +'/'+ e.dataItem.weekstart.split('-')[2];
                    var end = e.dataItem.weekend.split('-')[1] +'/'+ e.dataItem.weekend.split('-')[2];
                    return start + ' ~ ' + end
                }
            },
            title:{
                text: 'Date'
            },
        },
        tooltip: {
            visible: true,
            template: "#= series.name #: #= value #"
        }
    });
}

ds.subsLineHistoryData = function(res, field, valuetitle, title, median){
    $("#subschart"+ds.index()).html('')
    $("#subschart"+ds.index()).kendoChart({
        title: {
            text: title
        },
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
        categoryAxis: [{
            field: "category",
            labels: {
                rotation: 0
            },
            labels: {
                template: function(e){
                    var hour = e.value.split(' ')
                    var hour = hour[1].split(':')
                    return hour[0]
                }
            },
            title:{
                font: "12px Arial,Helvetica,sans-serif",
                text: median
            }
        },{
            field: "time",
            labels: {
                visible: false
            },
            line: {
                visible: false
            },
            title:{
                text: 'Hours & Date'
            }
        }],
        tooltip: {
            visible: true,
            template: function(e){
                // if (field == 'records' || field == 'sumDDL') {
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
                // }
            },
        }
    });
}

ds.subsLineHistoryDataDaily = function(res, field, ytitle, unit, min, title){
    _.each(res, function(v){
        v.category = new Date(v.category);
    });

    $("#subschart"+ds.index()).html('')
    $("#subschart"+ds.index()).kendoChart({
        title: {
            text: title
        },
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
            },
            type: "date",
            labels: {
              dateFormats: {
                days:"M/d"
              }
            }
        },
        yAxis: {
            title: {
                text: ytitle,
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
                // if (field == 'latency') {
                //     return '<tr><td>Count Latency</td><td>:</td><td>' + e.dataItem.num_latency + '</td></tr>'
                if (field == 'sumDDL') {
                    var tables = []
                    $.each(e.dataItem.tables, function(i,v){
                        if (i == 0) {
                            tables.push(v)
                        }else{
                            tables.push('<br/>'+v)
                        }
                    })

                    return '<tr> <td>Table Name</td><td>:</td><td>' + tables + '</td> </tr>'
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

ds.subsLineHistoryDataWeek = function(res, field, ytitle, unit, min, title){
    var date = []
    _.each(res, function(v){
        var start = v.weekstart.split('-')[1] +'/'+ v.weekstart.split('-')[2];
        var end = v.weekend.split('-')[1] +'/'+ v.weekend.split('-')[2];
        date.push(start + '~' + end)
    });
    ds.date(date[0])
    $("#subschart"+ds.index()).html('')
    $("#subschart"+ds.index()).kendoChart({
        title: {
            text: title
        },
        dataSource: res,
        seriesDefaults: {
            type: "scatter",
            markers: {
                size: 6
            }
        },
        series: [{
            xField: "weekstart",
            yField: field,
        }],
        xAxis: {
            title: {
                text: "Date",
            },
            type: "date",
            labels: {
                skip: 1,
                step: 2,
                template: function(e){
                    return ds.date()
                }
            }
        },
        yAxis: {
            title: {
                text: ytitle,
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
                // if (field == 'latency') {
                    // return '<tr><td>Count Latency</td><td>:</td><td>' + e.dataItem.num_latency + '</td></tr>'
                if (field == 'sumDDL') {
                    var tables = []
                    $.each(e.dataItem.tables, function(i,v){
                        if (i == 0) {
                            tables.push(v)
                        }else{
                            tables.push('<br/>'+v)
                        }
                    })

                    return '<tr> <td>Table Name</td><td>:</td><td>' + tables + '</td> </tr>'
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

ds.subsLineHistoryDataLatencyFreq = function(res, field, valuetitle, unit, min, title, median){
    $("#subschart"+ds.index()).html('')
    $("#subschart"+ds.index()).kendoChart({
        title: {
            text: title
        },
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
            markers: {
            visible: true,
                border: {
                    width: 1,
                    color: function(e){
                        if (e.value > 120){
                            return 'green'
                        }else{
                            return '#ff6800'
                        }
                    },
                }
            },
        },{
            field: field,
            name: field,
            title:{
                text: field,
            },
            markers: {
                visible: true,
                size: 1,
            },
            tooltip:{
                visible: false
            }
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
        categoryAxis: [{
            field: "period",
            labels: {
                rotation: 0
            },
            labels: {
                template: function(e){
                    var hour = e.dataItem.category.split(' ')
                    var hour = hour[1].split(':')
                    return hour[0]
                }
            },
            title:{
                font: "12px Arial,Helvetica,sans-serif",
                text: median
            }
        },{
            field: "time",
            labels: {
                visible: false
            },
            line: {
                visible: false
            },
            title:{
                text: 'Hours & Date'
            }
        }],
        tooltip: {
            visible: true,
            template: "#= series.name #: #= value #"
        }
    });
}

ds.subsLineHistoryDataLatencyDaily = function(res, field, ytitle, unit, min, title){
    _.each(res, function(v){
        v.category = new Date(v.category);
    });

    var groups = _.groupBy(res, function(value){
        return value.category + '#' + value.latgroup
    })
    var data = _.map(groups, function(group){
        return {
            category: group[0].category,
            latgroup: group[0].latgroup,
            num_latency: _.pluck(group, 'num_latency'),
            threshold: _.pluck(group, 'threshold'),
            latency: _.pluck(group, 'latency'),
            // value: 15
            value: _.reduce(_.pluck(group, 'latency'), function(memo, num){ 
                // return memo + num;
                if (group[0].latgroup == '<30') {
                    return 15
                } else if (group[0].latgroup == '<60') {
                    return 45
                } else if (group[0].latgroup == '<90') {
                    return 75
                } else if (group[0].latgroup == '<120') {
                    return 105
                } else {
                    return 135
                }
            }, 0)
        }
    })

    $("#subschart"+ds.index()).html('')
    $("#subschart"+ds.index()).kendoChart({
        title: {
            text: title
        },
        dataSource: data,
        seriesDefaults: {
            type: "scatter",
            markers: {
                size: function(e){
                    if (field == 'value') {
                        return 15
                    }else{
                        return 6
                    }
                }
            }
        },
        series: [{
            xField: "category",
            yField: field,
            labels:{
                visible: true,
                color: '#ff6800',
                font: "15px Arial,Helvetica,sans-serif",
                template: function(e){
                    var num = []
                    $.each(e.dataItem.num_latency, function(i,v){
                        num.push(v)
                    })
                    var sum = _.reduce(num, function(memo, num){ return memo + num; }, 0);
                    return kendo.toString(sum, 'n0')
                }
            }
        }],
        xAxis: {
            title: {
                text: "Date",
            },
            type: "date",
            labels: {
              dateFormats: {
                days:"M/d"
              }
            }
        },
        yAxis: {
            title: {
                text: ytitle,
            },
            labels: {
                skip: 1,
                step: 1
            },
            majorUnit: unit,
            labels: {
                template: function(e){
                    if (e.value == 120){
                        return '> 120'
                    }else{
                        return e.value
                    }
                }
            },
            min: min
        },
        tooltip: {
            visible: false,
            template: function(e){
                if (field == 'value') {
                    var num = []
                    $.each(e.dataItem.num_latency, function(i,v){
                        if (i == 0) {
                            num.push(v)
                        }else{
                            num.push(' '+v)
                        }
                    })

                    return '<tr> <td>Count Latency</td><td>:</td><td>' + num + '</td> </tr>'
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

ds.subsLineHistoryDataLatencyWeek = function(res, field, ytitle, unit, min, title){
    var date = []
    _.each(res, function(v){
        var start = v.weekstart.split('-')[1] +'/'+ v.weekstart.split('-')[2];
        var end = v.weekend.split('-')[1] +'/'+ v.weekend.split('-')[2];
        date.push(start + '~' + end)
    });
    ds.date(date[0])
    var groups = _.groupBy(res, function(value){
        return value.category + '#' + value.latgroup
    })
    var data = _.map(groups, function(group){
        return {
            weekstart: group[0].weekstart,
            latgroup: group[0].latgroup,
            num_latency: _.pluck(group, 'num_latency'),
            threshold: _.pluck(group, 'threshold'),
            latency: _.pluck(group, 'latency'),
            // value: 15
            value: _.reduce(_.pluck(group, 'latency'), function(memo, num){ 
                // return memo + num;
                if (group[0].latgroup == '<30') {
                    return 15
                } else if (group[0].latgroup == '<60') {
                    return 45
                } else if (group[0].latgroup == '<90') {
                    return 75
                } else if (group[0].latgroup == '<120') {
                    return 105
                } else {
                    return 135
                }
            }, 0)
        }
    })
    $("#subschart"+ds.index()).html('')
    $("#subschart"+ds.index()).kendoChart({
        title: {
            text: title
        },
        dataSource: data,
        seriesDefaults: {
            type: "scatter",
            markers: {
                size: function(e){
                    if (field == 'value') {
                        return 15
                    }else{
                        return 6
                    }
                }
            }
        },
        series: [{
            xField: "weekstart",
            yField: field,
            labels:{
                visible: true,
                color: '#ff6800',
                font: "15px Arial,Helvetica,sans-serif",
                template: function(e){
                    var num = []
                    $.each(e.dataItem.num_latency, function(i,v){
                        num.push(v)
                    })
                    var sum = _.reduce(num, function(memo, num){ return memo + num; }, 0);
                    return kendo.toString(sum, 'n0')
                }
            }
        }],
        xAxis: {
            title: {
                text: "Date",
            },
            type: "date",
            labels: {
                skip: 1,
                step: 2,
                template: function(e){
                    return ds.date()
                }
            }
        },
        yAxis: {
            title: {
                text: ytitle,
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
            visible: false,
            template: function(e){
                if (field == 'value') {
                    var num = []
                    $.each(e.dataItem.num_latency, function(i,v){
                        if (i == 0) {
                            num.push(v)
                        }else{
                            num.push(' '+v)
                        }
                    })

                    return '<tr> <td>Count Latency</td><td>:</td><td>' + num + '</td> </tr>'
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
    "Unknown",
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

ds.generateExcel = function(){
    var payload = {
        Server: ds.detailed.hostname(),
        Subscription: ds.detailed.subscription(),
        DateFrom: kendo.toString(new Date(ds.subsstartdate()), "yyyy-MM-dd 00:00:00"),
        DateTo: kendo.toString(new Date(ds.subsenddate()), "yyyy-MM-dd 00:00:00"),
    }
     if (ds.historymode() == 'Daily') {
        payload.DateTo = kendo.toString(new Date(moment(ds.subsstartdate()).add(8, 'days')), "yyyy-MM-dd 00:00:00")
    }else if (ds.historymode() == 'Weekly') {
        payload.DateTo = kendo.toString(new Date(moment(ds.subsstartdate()).add(8, 'week')), "yyyy-MM-dd 00:00:00")
    }else{
        payload.DateTo = kendo.toString(new Date(ds.subsstartdate()), "yyyy-MM-dd 00:00:00")
    }
    ajaxPost("/dashboard/genexcelbusytables", payload, function (res) {
        window.location.href = res.data.filepath
    })
}


// server status
ds.getSS = function(){
    var payload = {

    }
    ajaxPost("/dashboard/getserverdetail", payload, function (res) {
        var tiles = [];
        $.each(res.data.data, function(i,v){
            tiles.push(v)
        });
        ds.serverList(tiles);
        ds.loading(false)
    })
}

ds.detailSS = function(index){
    ds.ssindex(index)
    console.log(ds.ssindex())
    // ds.forDetail(index)
    // ds.detailloading(true)
    // ds.detailed.hostname(ds.tileList()[index].Server)
    // ds.detailed.serverport(ds.tileList()[index].Port)
    // ds.detailed.lastsync(ds.tileList()[index].LastSync)

    // ds.detailed.server(ds.tileList()[index].Server)
    
    // ds.detailed.purple(kendo.toString(ds.tileList()[index].PurpleSubsPrct, "n0"))
    // ds.detailed.green(kendo.toString(ds.tileList()[index].GreenSubsPrct, "n0"))
    // ds.detailed.red(kendo.toString(ds.tileList()[index].RedSubsPrct, "n0"))
    // ds.detailed.grey(kendo.toString(ds.tileList()[index].GreySubsPrct, "n0"))
    
    // var payload = {
    //     Server: ds.detailed.hostname(),
    //     Port: ds.detailed.serverport(),
    //     LastSync: kendo.toString(new Date(ds.detailed.lastsync()), "yyyy-MM-dd HH:mm:ss"),
    // }
    // ajaxPost("/dashboard/getapplicationwisedata", payload, function (res) {
    //     var app = [];
    //     $.each(res.data.data, function(i,v){
    //         app.push(v)
    //     });
    //     ds.applicationList(app);
    //     ds.detailloading(false)
    //     ds.serverhistory(false)
    //     ds.apphistory(false)
    //     ds.subshistory(false)
    // })
}
$(function(){
	ds.getCDC()
    ds.getSS()
})