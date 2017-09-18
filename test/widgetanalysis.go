package controllers

import (
	. "eaciit/dcm/dcmlive/models"
	// db "github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	tk "github.com/eaciit/toolkit"
	"gopkg.in/mgo.v2/bson"
	"strings"
)

type WidgetAnalysisController struct {
	*BaseController
}

func (c *WidgetAnalysisController) Default(k *knot.WebContext) interface{} {
	access := c.LoadBase(k)
	k.Config.NoLog = true
	k.Config.IncludeFiles = []string{
		"widgetanalysis/default.html",
		"widgetanalysis/script_template.html",
		"widgetanalysis/investor_chart.html",
		"widgetanalysis/default_chart.html",
		"widgetanalysis/allocation_chart.html",
		"widgetanalysis/commoninvestor_chart.html",
		"widgetanalysis/commonuninvestor_chart.html",
		"widgetanalysis/salespersons_chart.html",
		"widgetanalysis/distributions_chart.html",
	}
	k.Config.OutputType = knot.OutputTemplate
	k.Config.OutputType = knot.OutputTemplate
	DataAccess := Previlege{}

	for _, o := range access {
		DataAccess.Create = o["Create"].(bool)
		DataAccess.View = o["View"].(bool)
		DataAccess.Delete = o["Delete"].(bool)
		DataAccess.Process = o["Process"].(bool)
		DataAccess.Delete = o["Delete"].(bool)
		DataAccess.Edit = o["Edit"].(bool)
		DataAccess.Menuid = o["Menuid"].(string)
		DataAccess.Menuname = o["Menuname"].(string)
		DataAccess.Approve = o["Approve"].(bool)
		DataAccess.Username = o["Username"].(string)
	}

	return DataAccess
}

func (d *WidgetAnalysisController) GetDataGrid(k *knot.WebContext) interface{} {
	d.LoadBase(k)
	k.Config.OutputType = knot.OutputJson
	resdata := d.InitialResultInfo("Get Data", "GetDataGrid")
	defer d.LogBase(k, &resdata)

	crsx, ex := d.Ctx.Find(new(TradingComparablesModel), nil)
	if crsx == nil {
		resdata.IsError = true
		resdata.Message = "109. Cursor Not initialized.."
		resdata.Data = nil
	}
	defer crsx.Close()
	result := make([]TradingComparablesModel, 0)
	ex = crsx.Fetch(&result, 0, false)
	if ex != nil {
		resdata.IsError = true
		resdata.Message = "115. " + ex.Error()
		resdata.Data = nil
	}

	resdata.Data = result
	resdata.IsError = false
	resdata.Message = "Get Data Success"
	return resdata
}

type FilterWidget struct {
	Issuer            []interface{}
	Parentcompanyname []interface{}
	Continent         []interface{}
	Region            []interface{}
	Country           []interface{}
	Superindustry     []interface{}
	Industry          []interface{}
	Ownership         []interface{}
	Currency          []interface{}
	Ranking           []interface{}
	Product           []interface{}
	Flag              string
	Take              int
	Skip              int
	Sort              []tk.M
	Filter            Filter
}

type FilterInvestors struct {
	Issuer            []interface{}
	Parentcompanyname []interface{}
	Continent         []interface{}
	Region            []interface{}
	Country           []interface{}
	Superindustry     []interface{}
	Industry          []interface{}
	Ownership         []interface{}
	Currency          []interface{}
	Ranking           []interface{}
	Product           []interface{}
	Action            string
	Text              string
	Textmulti         []interface{}
	Take              int
	Skip              int
	Sort              []tk.M
	Filter            Filter
}

type FilterDistributions struct {
	Issuer            []interface{}
	Parentcompanyname []interface{}
	Continent         []interface{}
	Region            []interface{}
	Country           []interface{}
	Countrydetail     []interface{}
	Superindustry     []interface{}
	Industry          []interface{}
	Ownership         []interface{}
	Currency          []interface{}
	Ranking           []interface{}
	Product           []interface{}
	Actions           string
	Text              string
	Textmulti         []interface{}
	Take              int
	Skip              int
	Sort              []tk.M
	Filter            Filter
	Issuerdetail      []interface{} // For Common Investor Box
	Issuerdetail2     []interface{} // For Common Investor Box
	Flag              string        // For Common Investor Box
}

func (d *WidgetAnalysisController) GetFilterWidget(k *knot.WebContext) interface{} {
	d.LoadBase(k)
	k.Config.OutputType = knot.OutputJson

	resdata := d.InitialResultInfo("Search Data", "aearch legal entity supplier")
	defer d.LogBase(k, &resdata)

	payload := FilterWidget{}
	err := k.GetPayload(&payload)
	if err != nil {
		resdata.IsError = true
		resdata.Message = err.Error()
		resdata.Data = nil
	}

	WhereCond := d.GetFilterWidgetDefault(payload)

	groupby := "$" + payload.Flag
	pipe := []tk.M{
		tk.M{}.Set("$match", WhereCond),
		tk.M{}.Set("$group", tk.M{}.Set("_id", groupby)),
		tk.M{}.Set("$sort", tk.M{}.Set("_id", 1))}
	crsx, ex := d.Ctx.Connection.NewQuery().
		Command("pipe", pipe).
		From("bondsmaster").
		Cursor(nil)
	if crsx == nil {
		resdata.IsError = true
		resdata.Message = "109. Cursor Not initialized.."
		resdata.Data = nil
	}
	defer crsx.Close()
	ds := []tk.M{}
	ex = crsx.Fetch(&ds, 0, false)
	if ex != nil {
		resdata.IsError = true
		resdata.Message = "115. " + ex.Error()
		resdata.Data = nil
	}

	resdata.Data = ds
	resdata.IsError = false
	resdata.Message = "Get Data Success"
	return resdata.Data
}

func (d *WidgetAnalysisController) GetCountryDetail(k *knot.WebContext) interface{} {
	d.LoadBase(k)
	k.Config.OutputType = knot.OutputJson

	resdata := d.InitialResultInfo("Search Data", "aearch legal entity supplier")
	defer d.LogBase(k, &resdata)

	payload := FilterWidget{}
	err := k.GetPayload(&payload)
	if err != nil {
		resdata.IsError = true
		resdata.Message = err.Error()
		resdata.Data = nil
	}

	WhereCond := d.GetFilterWidgetDefault(payload)

	groupby := "$" + payload.Flag
	pipe := []tk.M{
		tk.M{}.Set("$match", WhereCond),
		tk.M{}.Set("$group", tk.M{}.Set("_id", groupby)),
		tk.M{}.Set("$sort", tk.M{}.Set("_id", 1))}
	crsx, ex := d.Ctx.Connection.NewQuery().
		Command("pipe", pipe).
		From("detailbonds").
		Cursor(nil)
	if crsx == nil {
		resdata.IsError = true
		resdata.Message = "109. Cursor Not initialized.."
		resdata.Data = nil
	}
	defer crsx.Close()
	ds := []tk.M{}
	ex = crsx.Fetch(&ds, 0, false)
	if ex != nil {
		resdata.IsError = true
		resdata.Message = "115. " + ex.Error()
		resdata.Data = nil
	}

	resdata.Data = ds
	resdata.IsError = false
	resdata.Message = "Get Data Success"
	return resdata.Data
}

func (d *WidgetAnalysisController) GetDonutInvestorOne(k *knot.WebContext) interface{} {
	d.LoadBase(k)
	k.Config.OutputType = knot.OutputJson
	resdata := d.InitialResultInfo("Get Data", "GetDonutInvestorOne")
	defer d.LogBase(k, &resdata)

	payload := FilterInvestors{}
	err := k.GetPayload(&payload)
	if err != nil {
		resdata.IsError = true
		resdata.Message = err.Error()
		resdata.Data = nil
	}

	WhereCond := d.GetFilterWidgetInvestor(payload)

	pipe := []tk.M{
		tk.M{}.Set("$match", WhereCond),
		tk.M{}.Set("$group", tk.M{}.Set("_id", "$industry").
			Set("value", tk.M{}.Set("$sum", "$allocated")))}

	result := []tk.M{}
	csr, ex := d.Ctx.Connection.NewQuery().
		Command("pipe", pipe).
		From("detailbonds").
		Cursor(nil)
	defer csr.Close()
	ex = csr.Fetch(&result, 0, false)

	if ex != nil {
		resdata.IsError = true
		resdata.Message = "115. " + ex.Error()
		resdata.Data = nil
	}

	resdata.Data = result
	resdata.IsError = false
	resdata.Message = "Get Data Success"
	return resdata
}

func (d *WidgetAnalysisController) GetDonutInvestorTwo(k *knot.WebContext) interface{} {
	d.LoadBase(k)
	k.Config.OutputType = knot.OutputJson
	resdata := d.InitialResultInfo("Get Data", "GetDonutInvestorTwo")
	defer d.LogBase(k, &resdata)

	payload := FilterInvestors{}
	err := k.GetPayload(&payload)
	if err != nil {
		resdata.IsError = true
		resdata.Message = err.Error()
		resdata.Data = nil
	}

	WhereCond := d.GetFilterWidgetInvestor(payload)

	pipe := []tk.M{
		tk.M{}.Set("$match", WhereCond),
		tk.M{}.Set("$group", tk.M{}.Set("_id", "$product").
			Set("value", tk.M{}.Set("$sum", "$allocated")))}

	result := []tk.M{}
	csr, ex := d.Ctx.Connection.NewQuery().
		Command("pipe", pipe).
		From("detailbonds").
		Cursor(nil)
	defer csr.Close()
	ex = csr.Fetch(&result, 0, false)

	if ex != nil {
		resdata.IsError = true
		resdata.Message = "115. " + ex.Error()
		resdata.Data = nil
	}

	resdata.Data = result
	resdata.IsError = false
	resdata.Message = "Get Data Success"
	return resdata
}

func (d *WidgetAnalysisController) GetDonutInvestorThird(k *knot.WebContext) interface{} {
	d.LoadBase(k)
	k.Config.OutputType = knot.OutputJson
	resdata := d.InitialResultInfo("Get Data", "GetDonutInvestorThird")
	defer d.LogBase(k, &resdata)

	payload := FilterInvestors{}
	err := k.GetPayload(&payload)
	if err != nil {
		resdata.IsError = true
		resdata.Message = err.Error()
		resdata.Data = nil
	}

	WhereCond := d.GetFilterWidgetInvestor(payload)

	pipe := []tk.M{
		tk.M{}.Set("$match", WhereCond),
		tk.M{}.Set("$group", tk.M{}.Set("_id", "$ranking").
			Set("value", tk.M{}.Set("$sum", "$allocated")))}

	result := []tk.M{}
	csr, ex := d.Ctx.Connection.NewQuery().
		Command("pipe", pipe).
		From("detailbonds").
		Cursor(nil)
	defer csr.Close()
	ex = csr.Fetch(&result, 0, false)

	if ex != nil {
		resdata.IsError = true
		resdata.Message = "115. " + ex.Error()
		resdata.Data = nil
	}

	resdata.Data = result
	resdata.IsError = false
	resdata.Message = "Get Data Success"
	return resdata
}

func (d *WidgetAnalysisController) GetGridInvestor(k *knot.WebContext) interface{} {
	d.LoadBase(k)
	k.Config.OutputType = knot.OutputJson
	resdata := d.InitialResultInfo("Get Data", "GetGridInvestor")
	defer d.LogBase(k, &resdata)

	payload := FilterInvestors{}
	err := k.GetPayload(&payload)
	if err != nil {
		resdata.IsError = true
		resdata.Message = err.Error()
		resdata.Data = nil
	}

	WhereCond := d.GetFilterWidgetInvestor(payload)

	sort := ""
	dir := ""
	if len(payload.Sort) > 0 {
		sort = strings.ToLower(payload.Sort[0].Get("field").(string))
		dir = payload.Sort[0].Get("dir").(string)
	} else if sort == "" {
		sort = "country"
	}

	// sortdef := "_id." + sort

	SortDefault := tk.M{}
	if dir == "desc" {
		SortDefault.Set(sort, -1)
	} else {
		SortDefault.Set(sort, 1)
	}

	Flimit := payload.Skip + payload.Take
	pipe := []tk.M{
		tk.M{}.Set("$match", WhereCond),
		tk.M{}.Set("$group", tk.M{}.Set("_id", tk.M{}.
			Set("issuer", "$issuer").
			Set("issue_date", "$issue_date").
			Set("currency", "$currency").
			Set("size", "$size").
			Set("ranking", "$ranking").
			Set("product", "$product").
			Set("ownership", "$ownership").
			Set("industry", "$industry").
			Set("country", "$country")).
			Set("allocated_amount", tk.M{}.Set("$sum", "$allocated"))),
		tk.M{}.Set("$project", tk.M{}.
			Set("_id", 0).
			Set("issuer", "$_id.issuer").
			Set("issue_date", "$_id.issue_date").
			Set("currency", "$_id.currency").
			Set("size", "$_id.size").
			Set("ranking", "$_id.ranking").
			Set("rating_type", "$_id.product").
			Set("ownership", "$_id.ownership").
			Set("industry", "$_id.industry").
			Set("country", "$_id.country").
			Set("allocated_amount", 1)),
		tk.M{}.Set("$sort", SortDefault),
		tk.M{}.Set("$limit", Flimit),
		tk.M{}.Set("$skip", payload.Skip),
	}

	result := []tk.M{}
	csr, ex := d.Ctx.Connection.NewQuery().
		Command("pipe", pipe).
		From("detailbonds").
		Cursor(nil)
	defer csr.Close()
	ex = csr.Fetch(&result, 0, false)

	if ex != nil {
		resdata.IsError = true
		resdata.Message = "115. " + ex.Error()
		resdata.Data = nil
	}

	// countstr := MgoQuery("detailbonds", "FindUseWhere", []string{}, "", "", WhereCond)
	// count := tk.ToInt(countstr.Error(), tk.RoundingAuto)
	pipet := []tk.M{
		tk.M{}.Set("$match", WhereCond),
		tk.M{}.Set("$group", tk.M{}.Set("_id", tk.M{}.
			Set("issuer", "$issuer").
			Set("issue_date", "$issue_date").
			Set("currency", "$currency").
			Set("size", "$size").
			Set("ranking", "$ranking").
			Set("product", "$product").
			Set("ownership", "$ownership").
			Set("industry", "$industry").
			Set("country", "$country")).
			Set("allocated_amount", tk.M{}.Set("$sum", "$allocated"))),
		tk.M{}.Set("$project", tk.M{}.
			Set("_id", 0).
			Set("issuer", "$_id.issuer").
			Set("issue_date", "$_id.issue_date").
			Set("currency", "$_id.currency").
			Set("size", "$_id.size").
			Set("ranking", "$_id.ranking").
			Set("rating_type", "$_id.product").
			Set("ownership", "$_id.ownership").
			Set("industry", "$_id.industry").
			Set("country", "$_id.country").
			Set("allocated_amount", 1)),
		tk.M{}.Set("$sort", SortDefault),
	}

	count := []tk.M{}
	csr2, ex2 := d.Ctx.Connection.NewQuery().
		Command("pipe", pipet).
		From("detailbonds").
		Cursor(nil)
	defer csr2.Close()
	ex2 = csr2.Fetch(&count, 0, false)

	if ex2 != nil {
		resdata.IsError = true
		resdata.Message = "115. " + ex2.Error()
		resdata.Data = nil
	}

	resdata.Data = result
	resdata.Total = len(count)
	resdata.IsError = false
	resdata.Message = "Get Data Success"
	return resdata
}

func (d *WidgetAnalysisController) GetInvestorName(k *knot.WebContext) interface{} {
	d.LoadBase(k)
	k.Config.OutputType = knot.OutputJson

	resdata := d.InitialResultInfo("Get Data", "GetInvestorName")
	defer d.LogBase(k, &resdata)

	pipe := []tk.M{
		tk.M{}.Set("$group", tk.M{}.Set("_id", "$investor_name")),
		tk.M{}.Set("$sort", tk.M{}.Set("_id", 1))}
	crsx, ex := d.Ctx.Connection.NewQuery().
		Command("pipe", pipe).
		From("detailbonds").
		Cursor(nil)
	if crsx == nil {
		resdata.IsError = true
		resdata.Message = "109. Cursor Not initialized.."
		resdata.Data = nil
	}
	defer crsx.Close()
	ds := []tk.M{}
	ex = crsx.Fetch(&ds, 0, false)
	if ex != nil {
		resdata.IsError = true
		resdata.Message = "115. " + ex.Error()
		resdata.Data = nil
	}

	resdata.Data = ds
	resdata.IsError = false
	resdata.Message = "Get Data Success"
	return resdata.Data
}

func (d *WidgetAnalysisController) GetGridTransaction(k *knot.WebContext) interface{} {
	d.LoadBase(k)
	k.Config.OutputType = knot.OutputJson

	resdata := d.InitialResultInfo("Search Data", "aearch legal entity supplier")
	defer d.LogBase(k, &resdata)

	payload := FilterWidget{}
	err := k.GetPayload(&payload)
	if err != nil {
		resdata.IsError = true
		resdata.Message = err.Error()
		resdata.Data = nil
	}

	WhereCond := d.GetFilterWidgetDefault(payload)
	group := "$investor_name"
	if payload.Flag != "" {
		group = "$" + payload.Flag
	}

	Flimit := payload.Skip + payload.Take
	pipe := []tk.M{
		tk.M{
			"$match": WhereCond,
		},
		tk.M{
			"$group": tk.M{
				"_id":       group,
				"firm":      tk.M{"$sum": "$firm"},
				"allocated": tk.M{"$sum": "$allocated"},
			},
		},
		tk.M{
			"$sort": tk.M{
				"allocated": -1,
			},
		},
		tk.M{}.Set("$limit", Flimit),
		tk.M{}.Set("$skip", payload.Skip),
	}

	crsx, ex := d.Ctx.Connection.NewQuery().
		Command("pipe", pipe).
		From("detailbonds").
		Cursor(nil)
	if crsx == nil {
		resdata.IsError = true
		resdata.Message = "109. Cursor Not initialized.."
		resdata.Data = nil
	}
	defer crsx.Close()
	ds := []tk.M{}
	ex = crsx.Fetch(&ds, 0, false)
	if ex != nil {
		resdata.IsError = true
		resdata.Message = "115. " + ex.Error()
		resdata.Data = nil
	}
	max := 0.0
	if len(ds) != 0 {
		max = ds[0].GetFloat64("allocated")
	}

	final := tk.M{}.Set("max", max).Set("data", ds)

	// countstr := MgoQuery("detailbonds", "FindUseWhere", []string{}, "", "", WhereCond)
	// count := tk.ToInt(countstr.Error(), tk.RoundingAuto)

	pipet := []tk.M{
		tk.M{
			"$match": WhereCond,
		},
		tk.M{
			"$group": tk.M{
				"_id":       group,
				"firm":      tk.M{"$sum": "$firm"},
				"allocated": tk.M{"$sum": "$allocated"},
			},
		},
		tk.M{
			"$sort": tk.M{
				"allocated": -1,
			},
		},
	}

	crs, er := d.Ctx.Connection.NewQuery().
		Command("pipe", pipet).
		From("detailbonds").
		Cursor(nil)
	defer crs.Close()
	count := []tk.M{}
	er = crs.Fetch(&count, 0, false)
	if er != nil {
		resdata.IsError = true
		resdata.Message = "115. " + er.Error()
		resdata.Data = nil
	}

	resdata.Data = final
	resdata.Total = len(count)
	resdata.IsError = false
	resdata.Message = "Get Data Success"
	return resdata
}

func (d *WidgetAnalysisController) GetFilterWidgetDefault(payload FilterWidget) tk.M {
	WhereCond := tk.M{}

	if len(payload.Issuer) != 0 {
		WhereCond.Set("issuer", tk.M{}.Set("$in", payload.Issuer))
	} else {
		WhereCond.Set("issuer", tk.M{}.Set("$ne", ""))
	}

	if len(payload.Parentcompanyname) != 0 {
		WhereCond.Set("parent_company_name", tk.M{}.Set("$in", payload.Parentcompanyname))
	}

	if len(payload.Continent) != 0 {
		WhereCond.Set("continent", tk.M{}.Set("$in", payload.Continent))
	}

	if len(payload.Region) != 0 {
		WhereCond.Set("region", tk.M{}.Set("$in", payload.Region))
	}

	if len(payload.Country) != 0 {
		WhereCond.Set("country", tk.M{}.Set("$in", payload.Country))
	}

	if len(payload.Superindustry) != 0 {
		WhereCond.Set("super_industry", tk.M{}.Set("$in", payload.Superindustry))
	}

	if len(payload.Industry) != 0 {
		WhereCond.Set("industry", tk.M{}.Set("$in", payload.Industry))
	}

	if len(payload.Ownership) != 0 {
		WhereCond.Set("ownership", tk.M{}.Set("$in", payload.Ownership))
	}

	if len(payload.Currency) != 0 {
		WhereCond.Set("currency", tk.M{}.Set("$in", payload.Currency))
	}

	if len(payload.Ranking) != 0 {
		WhereCond.Set("ranking", tk.M{}.Set("$in", payload.Ranking))
	}

	if len(payload.Product) != 0 {
		WhereCond.Set("product", tk.M{}.Set("$in", payload.Product))
	}

	if payload.Filter.Logic != "" {
		for i, _ := range payload.Filter.Filters {
			if payload.Filter.Filters[i].Value != "" {
				switch payload.Filter.Filters[i].Operator {
				case "eq":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), payload.Filter.Filters[i].Value)
					break
				case "neq":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), tk.M{}.Set("$ne", payload.Filter.Filters[i].Value))
					break
				case "doesnotcontain":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), tk.M{}.Set("$ne", payload.Filter.Filters[i].Value))
					break
				case "startswith":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), bson.RegEx{"^" + payload.Filter.Filters[i].Value, "i"})
					break
				case "endswith":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), bson.RegEx{payload.Filter.Filters[i].Value + "$", "i"})
					break
				default:
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), bson.RegEx{payload.Filter.Filters[i].Value, "i"})
					break
				}
			}
		}
	}

	return WhereCond
}

func (d *WidgetAnalysisController) GetFilterWidgetInvestor(payload FilterInvestors) tk.M {
	WhereCond := tk.M{}

	if len(payload.Issuer) != 0 {
		WhereCond.Set("issuer", tk.M{}.Set("$in", payload.Issuer))
	} else {
		WhereCond.Set("issuer", tk.M{}.Set("$ne", ""))
	}

	if len(payload.Parentcompanyname) != 0 {
		WhereCond.Set("parent_company_name", tk.M{}.Set("$in", payload.Parentcompanyname))
	}

	if len(payload.Continent) != 0 {
		WhereCond.Set("continent", tk.M{}.Set("$in", payload.Continent))
	}

	if len(payload.Region) != 0 {
		WhereCond.Set("region", tk.M{}.Set("$in", payload.Region))
	}

	if len(payload.Country) != 0 {
		WhereCond.Set("country", tk.M{}.Set("$in", payload.Country))
	}

	if len(payload.Superindustry) != 0 {
		WhereCond.Set("super_industry", tk.M{}.Set("$in", payload.Superindustry))
	}

	if len(payload.Industry) != 0 {
		WhereCond.Set("industry", tk.M{}.Set("$in", payload.Industry))
	}

	if len(payload.Ownership) != 0 {
		WhereCond.Set("ownership", tk.M{}.Set("$in", payload.Ownership))
	}

	if len(payload.Currency) != 0 {
		WhereCond.Set("currency", tk.M{}.Set("$in", payload.Currency))
	}

	if len(payload.Ranking) != 0 {
		WhereCond.Set("ranking", tk.M{}.Set("$in", payload.Ranking))
	}

	if len(payload.Product) != 0 {
		WhereCond.Set("product", tk.M{}.Set("$in", payload.Product))
	}

	if payload.Action == "Equals" {
		if len(payload.Textmulti) != 0 {
			WhereCond.Set("investor_name", tk.M{}.Set("$in", payload.Textmulti))
		}
	} else if payload.Action == "Contains" {
		if payload.Text != "" {
			WhereCond.Set("investor_name", bson.RegEx{payload.Text, "i"})
		}
	}

	if payload.Filter.Logic != "" {
		for i, _ := range payload.Filter.Filters {
			if payload.Filter.Filters[i].Value != "" {
				switch payload.Filter.Filters[i].Operator {
				case "eq":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), payload.Filter.Filters[i].Value)
					break
				case "neq":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), tk.M{}.Set("$ne", payload.Filter.Filters[i].Value))
					break
				case "doesnotcontain":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), tk.M{}.Set("$ne", payload.Filter.Filters[i].Value))
					break
				case "startswith":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), bson.RegEx{"^" + payload.Filter.Filters[i].Value, "i"})
					break
				case "endswith":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), bson.RegEx{payload.Filter.Filters[i].Value + "$", "i"})
					break
				default:
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), bson.RegEx{payload.Filter.Filters[i].Value, "i"})
					break
				}
			}
		}
	}

	return WhereCond
}

func (d *WidgetAnalysisController) SaveWidgetAnalysis(k *knot.WebContext) interface{} {
	k.Config.NoLog = true
	k.Config.OutputType = knot.OutputJson

	resdata := d.InitialResultInfo("Save Data", "save template name")
	defer d.LogBase(k, &resdata)

	payload := tk.M{}

	err := k.GetPayload(&payload)

	id := payload.GetString("TemplateName")
	payload.Set("_id", id)

	err = d.Ctx.Connection.NewQuery().
		From("widgetanalysis").
		SetConfig("multiexec", true).
		Save().Exec(tk.M{}.Set("data", payload))

	if err != nil {
		resdata.Message = "save unsuccess"
		resdata.IsError = false
		resdata.Data = nil
		return resdata
	}

	resdata.Data = payload
	resdata.IsError = false
	resdata.Message = "Save Data Success"
	return resdata
}

func (d *WidgetAnalysisController) GetWidgetAnalysis(k *knot.WebContext) interface{} {
	d.LoadBase(k)
	k.Config.OutputType = knot.OutputJson
	resdata := d.InitialResultInfo("Search Data", "get template name")
	defer d.LogBase(k, &resdata)

	query := d.Ctx.Connection.NewQuery()
	result := []tk.M{}
	csr, e := query.
		Select("_id").
		From("widgetanalysis").
		Order("_id").
		Cursor(nil)
	e = csr.Fetch(&result, 0, false)

	if e != nil {
		resdata.IsError = true
		resdata.Message = e.Error()
		resdata.Data = nil
	}
	defer csr.Close()

	resdata.Data = result
	resdata.IsError = false
	resdata.Message = "Get Data Success"
	return resdata
}

func (d *WidgetAnalysisController) GetDetailsWidgetAnalysis(k *knot.WebContext) interface{} {
	d.LoadBase(k)
	k.Config.OutputType = knot.OutputJson
	resdata := d.InitialResultInfo("Search Data", "get details template name")
	defer d.LogBase(k, &resdata)

	payload := struct {
		Id string
	}{}
	err := k.GetPayload(&payload)

	if err != nil {
		resdata.IsError = true
		resdata.Message = err.Error()
		resdata.Data = nil
	}

	WhereCond := tk.M{}

	if payload.Id != "" {
		WhereCond.Set("_id", payload.Id)
	}

	pipe := []tk.M{
		tk.M{}.Set("$match", WhereCond),
		tk.M{}.Set("$sort", tk.M{}.Set("_id", 1))}
	crsx, ex := d.Ctx.Connection.NewQuery().
		Command("pipe", pipe).
		From("widgetanalysis").
		Cursor(nil)
	if crsx == nil {
		resdata.IsError = true
		resdata.Message = "109. Cursor Not initialized.."
		resdata.Data = nil
	}
	defer crsx.Close()
	ds := tk.M{}
	ex = crsx.Fetch(&ds, 1, false)
	if ex != nil {
		resdata.IsError = true
		resdata.Message = "115. " + ex.Error()
		resdata.Data = nil
	}

	resdata.Data = ds
	resdata.IsError = false
	resdata.Message = "Get Data Success"
	return resdata
}

type FilterAllocation struct {
	Issuer            []interface{}
	Parentcompanyname []interface{}
	Continent         []interface{}
	Region            []interface{}
	Country           []interface{}
	Superindustry     []interface{}
	Industry          []interface{}
	Ownership         []interface{}
	Currency          []interface{}
	Ranking           []interface{}
	Product           []interface{}
	InputOne          float64
	InputTwo          float64
	Take              int
	Skip              int
	Sort              []tk.M
	Filter            Filter
}

func (d *WidgetAnalysisController) GetFilterWidgetAllocation(payload FilterAllocation) tk.M {
	WhereCond := tk.M{}

	if len(payload.Issuer) != 0 {
		WhereCond.Set("issuer", tk.M{}.Set("$in", payload.Issuer))
	} else {
		WhereCond.Set("issuer", tk.M{}.Set("$ne", ""))
	}

	if len(payload.Parentcompanyname) != 0 {
		WhereCond.Set("parent_company_name", tk.M{}.Set("$in", payload.Parentcompanyname))
	}

	if len(payload.Continent) != 0 {
		WhereCond.Set("continent", tk.M{}.Set("$in", payload.Continent))
	}

	if len(payload.Region) != 0 {
		WhereCond.Set("region", tk.M{}.Set("$in", payload.Region))
	}

	if len(payload.Country) != 0 {
		WhereCond.Set("country", tk.M{}.Set("$in", payload.Country))
	}

	if len(payload.Superindustry) != 0 {
		WhereCond.Set("super_industry", tk.M{}.Set("$in", payload.Superindustry))
	}

	if len(payload.Industry) != 0 {
		WhereCond.Set("industry", tk.M{}.Set("$in", payload.Industry))
	}

	if len(payload.Ownership) != 0 {
		WhereCond.Set("ownership", tk.M{}.Set("$in", payload.Ownership))
	}

	if len(payload.Currency) != 0 {
		WhereCond.Set("currency", tk.M{}.Set("$in", payload.Currency))
	}

	if len(payload.Ranking) != 0 {
		WhereCond.Set("ranking", tk.M{}.Set("$in", payload.Ranking))
	}

	if len(payload.Product) != 0 {
		WhereCond.Set("product", tk.M{}.Set("$in", payload.Product))
	}

	if payload.Filter.Logic != "" {
		for i, _ := range payload.Filter.Filters {
			if payload.Filter.Filters[i].Value != "" {
				switch payload.Filter.Filters[i].Operator {
				case "eq":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), payload.Filter.Filters[i].Value)
					break
				case "neq":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), tk.M{}.Set("$ne", payload.Filter.Filters[i].Value))
					break
				case "doesnotcontain":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), tk.M{}.Set("$ne", payload.Filter.Filters[i].Value))
					break
				case "startswith":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), bson.RegEx{"^" + payload.Filter.Filters[i].Value, "i"})
					break
				case "endswith":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), bson.RegEx{payload.Filter.Filters[i].Value + "$", "i"})
					break
				default:
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), bson.RegEx{payload.Filter.Filters[i].Value, "i"})
					break
				}
			}
		}
	}

	return WhereCond
}

func (d *WidgetAnalysisController) GetGridAllocation(k *knot.WebContext) interface{} {
	d.LoadBase(k)
	k.Config.OutputType = knot.OutputJson
	resdata := d.InitialResultInfo("Get Data", "GetGridAllocation")
	defer d.LogBase(k, &resdata)

	payload := FilterAllocation{}
	err := k.GetPayload(&payload)
	if err != nil {
		resdata.IsError = true
		resdata.Message = err.Error()
		resdata.Data = nil
	}

	WhereCond := d.GetFilterWidgetAllocation(payload)
	sort := ""
	dir := ""
	if len(payload.Sort) > 0 {
		sort = strings.ToLower(payload.Sort[0].Get("field").(string))
		dir = payload.Sort[0].Get("dir").(string)
	} else if sort == "" {
		sort = "investor_name"
	}

	sortdef := "_id." + sort

	SortDefault := tk.M{}
	if dir == "desc" {
		SortDefault.Set(sortdef, -1)
	} else {
		SortDefault.Set(sortdef, 1)
	}

	Flimit := payload.Skip + payload.Take
	pipe := []tk.M{
		tk.M{}.Set("$match", WhereCond),
		tk.M{}.Set("$group", tk.M{}.Set("_id", tk.M{}.
			Set("investor_name", "$investor_name").
			Set("issue_date", "$issue_date").
			Set("issuer", "$issuer").
			Set("size", "$size").
			Set("currency", "$currency").
			Set("ranking", "$ranking").
			Set("product", "$product")).
			Set("firm", tk.M{}.Set("$sum", "$firm")).
			Set("allocated_amount", tk.M{}.Set("$sum", "$allocated"))),
		tk.M{}.Set("$sort", SortDefault),
		tk.M{}.Set("$limit", Flimit),
		tk.M{}.Set("$skip", payload.Skip),
	}

	result := []tk.M{}
	csr, ex := d.Ctx.Connection.NewQuery().
		Command("pipe", pipe).
		From("detailbonds").
		Cursor(nil)
	defer csr.Close()
	ex = csr.Fetch(&result, 0, false)

	if ex != nil {
		resdata.IsError = true
		resdata.Message = "115. " + ex.Error()
		resdata.Data = nil
	}


	pipe2 := []tk.M{
		tk.M{}.Set("$match", WhereCond),
		tk.M{}.Set("$group", tk.M{}.Set("_id", "$issuer").
			Set("firm", tk.M{}.Set("$sum", "$firm")).
			Set("allocated_amount", tk.M{}.Set("$sum", "$allocated"))),
	}

	result2 := []tk.M{}
	csr2, ex2 := d.Ctx.Connection.NewQuery().
		Command("pipe", pipe2).
		From("detailbonds").
		Cursor(nil)
	defer csr2.Close()
	ex2 = csr2.Fetch(&result2, 0, false)

	if ex2 != nil {
		resdata.IsError = true
		resdata.Message = "115. " + ex.Error()
		resdata.Data = nil
	}
	FirmIssuer 	:= make(map[string]float64, 0)
	AllocIssuer := make(map[string]float64, 0)
	for _, totalPerIssuer := range result2 {
		key := totalPerIssuer.GetString("_id")
		frm := totalPerIssuer.GetFloat64("firm")
		allc := totalPerIssuer.GetFloat64("allocated_amount")
		FirmIssuer[key] = frm 
		AllocIssuer[key] = allc 
	}


	res := []tk.M{}
	for _, i := range result {
		obj := tk.M{}

		idx := i["_id"].(tk.M)
		firm := i.GetFloat64("firm")
		allocated := i.GetFloat64("allocated_amount")
		issr := idx.GetString("issuer")

		avg1 := (allocated / firm) * 100
		avg2 := FirmIssuer[issr] / AllocIssuer[issr]

		if avg1 >= payload.InputOne && avg2 >= payload.InputTwo {
			obj.Set("investor_name", idx.GetString("investor_name"))
			obj.Set("issue_date", idx.GetString("issue_date"))
			obj.Set("issuer", idx.GetString("issuer"))
			obj.Set("size", idx.GetFloat64("size"))
			obj.Set("currency", idx.GetString("currency"))
			obj.Set("ranking", idx.GetString("ranking"))
			obj.Set("product", idx.GetString("product"))
		} else {
			continue
		}

		res = append(res, obj)
	}

	// countstr := MgoQuery("detailbonds", "FindUseWhere", []string{}, "", "", WhereCond)
	// count := tk.ToInt(countstr.Error(), tk.RoundingAuto)

	pipet := []tk.M{
		tk.M{}.Set("$match", WhereCond),
		tk.M{}.Set("$group", tk.M{}.Set("_id", tk.M{}.
			Set("investor_name", "$investor_name").
			Set("issue_date", "$issue_date").
			Set("issuer", "$issuer").
			Set("size", "$size").
			Set("currency", "$currency").
			Set("ranking", "$ranking").
			Set("product", "$product")).
			Set("firm", tk.M{}.Set("$sum", "$firm")).
			Set("allocated_amount", tk.M{}.Set("$sum", "$allocated"))),
		tk.M{}.Set("$sort", SortDefault),
	}

	count := []tk.M{}
	csrx, er := d.Ctx.Connection.NewQuery().
		Command("pipe", pipet).
		From("detailbonds").
		Cursor(nil)
	defer csrx.Close()
	er = csrx.Fetch(&count, 0, false)
	if er != nil {
		resdata.IsError = true
		resdata.Message = "115. " + er.Error()
		resdata.Data = nil
	}

	resdata.Data = res
	resdata.Total = len(count)
	resdata.IsError = false
	resdata.Message = "Get Data Success"
	return resdata
}

func (d *WidgetAnalysisController) GetFilterWidgetDistributions(payload FilterDistributions) (tk.M, bool) {
	WhereCond := tk.M{}
	blank := false
	if len(payload.Issuer) == 0 {
		if payload.Actions == "Equals" {
			if len(payload.Textmulti) != 0 {
				WhereCond.Set("issuer", tk.M{}.Set("$in", payload.Textmulti))
			}
		} else if payload.Actions == "Contains" {
			if payload.Text != "" {
				WhereCond.Set("issuer", bson.RegEx{payload.Text, "i"})
			}
		}
	} else {
		if len(payload.Textmulti) == 0 && payload.Text == "" {
			if len(payload.Issuer) != 0 {
				WhereCond.Set("issuer", tk.M{}.Set("$in", payload.Issuer))
			}
		} else {
			condIssuer := []string{}
			Contains := false
			for _, listIssuer := range payload.Issuer {
				lowerIssuer := strings.ToLower(listIssuer.(string))
				if payload.Actions == "Equals" && len(payload.Textmulti) != 0 {
					WhereCond.Set("issuer", tk.M{}.Set("$in", payload.Textmulti))
				} else if payload.Actions == "Contains" && payload.Text != "" {
					Contains = true
					lowerDetail := strings.ToLower(payload.Text)
					if strings.Index(lowerIssuer, lowerDetail) > -1 {
						condIssuer = append(condIssuer, listIssuer.(string))
					}
				}
			}
			if len(condIssuer) != 0 {
				WhereCond.Set("issuer", tk.M{}.Set("$in", condIssuer))
			} else if Contains {
				blank = true
			}
		}
	}

	if !blank {
		if len(payload.Parentcompanyname) != 0 {
			WhereCond.Set("parent_company_name", tk.M{}.Set("$in", payload.Parentcompanyname))
		}

		if len(payload.Continent) != 0 {
			WhereCond.Set("continent", tk.M{}.Set("$in", payload.Continent))
		}

		if len(payload.Region) != 0 {
			WhereCond.Set("region", tk.M{}.Set("$in", payload.Region))
		}

		if len(payload.Country) != 0 {
			WhereCond.Set("country_parent", tk.M{}.Set("$in", payload.Country))
		}

		if len(payload.Countrydetail) != 0 {
			WhereCond.Set("country", tk.M{}.Set("$in", payload.Countrydetail))
		}

		if len(payload.Superindustry) != 0 {
			WhereCond.Set("super_industry", tk.M{}.Set("$in", payload.Superindustry))
		}

		if len(payload.Industry) != 0 {
			WhereCond.Set("industry", tk.M{}.Set("$in", payload.Industry))
		}

		if len(payload.Ownership) != 0 {
			WhereCond.Set("ownership", tk.M{}.Set("$in", payload.Ownership))
		}

		if len(payload.Currency) != 0 {
			WhereCond.Set("currency", tk.M{}.Set("$in", payload.Currency))
		}

		if len(payload.Ranking) != 0 {
			WhereCond.Set("ranking", tk.M{}.Set("$in", payload.Ranking))
		}

		if len(payload.Product) != 0 {
			WhereCond.Set("product", tk.M{}.Set("$in", payload.Product))
		} else {
			WhereCond.Set("product", tk.M{}.Set("$ne", ""))
		}

		if payload.Filter.Logic != "" {
			for i, _ := range payload.Filter.Filters {
				if payload.Filter.Filters[i].Value != "" {
					switch payload.Filter.Filters[i].Operator {
					case "eq":
						WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), payload.Filter.Filters[i].Value)
						break
					case "neq":
						WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), tk.M{}.Set("$ne", payload.Filter.Filters[i].Value))
						break
					case "doesnotcontain":
						WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), tk.M{}.Set("$ne", payload.Filter.Filters[i].Value))
						break
					case "startswith":
						WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), bson.RegEx{"^" + payload.Filter.Filters[i].Value, "i"})
						break
					case "endswith":
						WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), bson.RegEx{payload.Filter.Filters[i].Value + "$", "i"})
						break
					default:
						WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), bson.RegEx{payload.Filter.Filters[i].Value, "i"})
						break
					}
				}
			}
		}

	}

	return WhereCond, blank
}

func (d *WidgetAnalysisController) GetGridDistributions(k *knot.WebContext) interface{} {
	d.LoadBase(k)
	k.Config.OutputType = knot.OutputJson
	resdata := d.InitialResultInfo("Get Data", "GetGridAllocation")
	defer d.LogBase(k, &resdata)

	payload := FilterDistributions{}
	err := k.GetPayload(&payload)
	if err != nil {
		resdata.IsError = true
		resdata.Message = err.Error()
		resdata.Data = nil
	}

	WhereCond, blank := d.GetFilterWidgetDistributions(payload)

	sort := ""
	dir := ""
	if len(payload.Sort) > 0 {
		sort = strings.ToLower(payload.Sort[0].Get("field").(string))
		dir = payload.Sort[0].Get("dir").(string)
	} else if sort == "" {
		sort = "country"
	} else if dir != "" && dir != "asc" {
		sort = "-" + sort
	}

	SortDefault := tk.M{}
	if dir == "desc" {
		SortDefault.Set(sort, -1)
	} else {
		SortDefault.Set(sort, 1)
	}

	result := []tk.M{}
	column := []string{}
	if !blank {
		Group := tk.M{}
		Group.Set("isin", "$issuer").
			Set("investor_name", "$investor_name")

		// Flimit := payload.Skip + payload.Take
		pipe := []tk.M{
			tk.M{
				"$match": WhereCond,
			},
			tk.M{
				"$group": tk.M{
					"_id": Group,
				},
			},
			// tk.M{}.Set("$sort", SortDefault),
			// tk.M{}.Set("$limit", Flimit),
			// tk.M{}.Set("$skip", payload.Skip),
		}

		crsx, ex := d.Ctx.Connection.NewQuery().
			Command("pipe", pipe).
			From("detailbonds").
			Cursor(nil)
		if crsx == nil {
			resdata.IsError = true
			resdata.Message = "109. Cursor Not initialized.."
			resdata.Data = nil
		}
		defer crsx.Close()
		ds := []tk.M{}
		ex = crsx.Fetch(&ds, 0, false)
		if ex != nil {
			resdata.IsError = true
			resdata.Message = "115. " + ex.Error()
			resdata.Data = nil
		}
		TickMark := make(map[string]string, 0)
		investorMaster := tk.M{}
		isinMaster := tk.M{}
		for _, process := range ds {
			child := process["_id"].(tk.M)
			isin := child.GetString("isin")
			investor := child.GetString("investor_name")
			investorMaster.Set(investor, investor)
			isinMaster.Set(isin, isin)
			key := investor + isin
			TickMark[key] = "Y"
		}
		i := 0
		for _, finalprocess := range investorMaster {
			invstr := finalprocess.(string)
			tkm := tk.M{}
			tkm.Set("investorname", invstr)
			for _, isinList := range isinMaster {
				isinstr := isinList.(string)
				key := invstr + isinstr
				exist := "x"
				if TickMark[key] == "Y" {
					exist = "v"
				}
				tkm.Set(isinstr, exist)
				if i == 0 {
					column = append(column, isinstr)
				}
			}
			result = append(result, tkm)
			i++
		}

	}

	res := tk.M{}.Set("data", result).Set("column", column)

	countstr := MgoQuery("detailbonds", "FindUseWhere", []string{}, "", "", WhereCond)
	count := tk.ToInt(countstr.Error(), tk.RoundingAuto)

	resdata.Data = res
	resdata.Total = count
	resdata.IsError = false
	resdata.Message = "Get Data Success"
	return resdata
}

func (d *WidgetAnalysisController) GetFilterWidgetCommon(payload FilterDistributions) tk.M {
	WhereCond := tk.M{}

	if payload.Flag != "Uninvestor" {
		if len(payload.Issuerdetail) != 0 {
			WhereCond.Set("issuer", tk.M{}.Set("$in", payload.Issuerdetail))
		} else if len(payload.Issuer) != 0 {
			WhereCond.Set("issuer", tk.M{}.Set("$in", payload.Issuer))
		}
	} else {
		if len(payload.Issuerdetail) != 0 || len(payload.Issuerdetail2) != 0 {
			allIssuer := []string{}
			for _, all := range payload.Issuerdetail {
				allIssuer = append(allIssuer, all.(string))
			}
			for _, all2 := range payload.Issuerdetail2 {
				allIssuer = append(allIssuer, all2.(string))
			}
			WhereCond.Set("issuer", tk.M{}.Set("$in", allIssuer))
		} else {
			WhereCond.Set("issuer", tk.M{}.Set("$in", payload.Issuer))
		}
	}

	if len(payload.Parentcompanyname) != 0 {
		WhereCond.Set("parent_company_name", tk.M{}.Set("$in", payload.Parentcompanyname))
	}

	if len(payload.Continent) != 0 {
		WhereCond.Set("continent", tk.M{}.Set("$in", payload.Continent))
	}

	if len(payload.Region) != 0 {
		WhereCond.Set("region", tk.M{}.Set("$in", payload.Region))
	}

	if len(payload.Country) != 0 {
		WhereCond.Set("country_parent", tk.M{}.Set("$in", payload.Country))
	}

	if len(payload.Countrydetail) != 0 {
		WhereCond.Set("country", tk.M{}.Set("$in", payload.Countrydetail))
	}

	if len(payload.Superindustry) != 0 {
		WhereCond.Set("super_industry", tk.M{}.Set("$in", payload.Superindustry))
	}

	if len(payload.Industry) != 0 {
		WhereCond.Set("industry", tk.M{}.Set("$in", payload.Industry))
	}

	if len(payload.Ownership) != 0 {
		WhereCond.Set("ownership", tk.M{}.Set("$in", payload.Ownership))
	}

	if len(payload.Currency) != 0 {
		WhereCond.Set("currency", tk.M{}.Set("$in", payload.Currency))
	}

	if len(payload.Ranking) != 0 {
		WhereCond.Set("ranking", tk.M{}.Set("$in", payload.Ranking))
	}

	if len(payload.Product) != 0 {
		WhereCond.Set("product", tk.M{}.Set("$in", payload.Product))
	} else {
		WhereCond.Set("product", tk.M{}.Set("$ne", ""))
	}

	if payload.Filter.Logic != "" {
		for i, _ := range payload.Filter.Filters {
			if payload.Filter.Filters[i].Value != "" {
				switch payload.Filter.Filters[i].Operator {
				case "eq":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), payload.Filter.Filters[i].Value)
					break
				case "neq":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), tk.M{}.Set("$ne", payload.Filter.Filters[i].Value))
					break
				case "doesnotcontain":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), tk.M{}.Set("$ne", payload.Filter.Filters[i].Value))
					break
				case "startswith":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), bson.RegEx{"^" + payload.Filter.Filters[i].Value, "i"})
					break
				case "endswith":
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), bson.RegEx{payload.Filter.Filters[i].Value + "$", "i"})
					break
				default:
					WhereCond.Set(strings.ToLower(payload.Filter.Filters[i].Field), bson.RegEx{payload.Filter.Filters[i].Value, "i"})
					break
				}
			}
		}
	}

	return WhereCond
}

func (d *WidgetAnalysisController) GetGridCommon(k *knot.WebContext) interface{} {
	d.LoadBase(k)
	k.Config.OutputType = knot.OutputJson

	resdata := d.InitialResultInfo("Search Data", "aearch legal entity supplier")
	defer d.LogBase(k, &resdata)

	payload := FilterDistributions{}
	err := k.GetPayload(&payload)
	if err != nil {
		resdata.IsError = true
		resdata.Message = err.Error()
		resdata.Data = nil
	}

	result := []tk.M{}
	max := 0.0
	count := 0
	if len(payload.Issuerdetail) != 0 {
		WhereCond := d.GetFilterWidgetCommon(payload)
		Group := tk.M{}
		Group.Set("issuer", "$issuer").
			Set("grouppayload", "$investor_name")

		// Flimit := payload.Skip + payload.Take
		pipe := []tk.M{
			tk.M{
				"$match": WhereCond,
			},
			tk.M{
				"$group": tk.M{
					"_id":       Group,
					"firm":      tk.M{"$sum": "$firm"},
					"allocated": tk.M{"$sum": "$allocated"},
				},
			},
			// tk.M{}.Set("$limit", Flimit),
			// tk.M{}.Set("$skip", payload.Skip),
		}

		crsx, ex := d.Ctx.Connection.NewQuery().
			Command("pipe", pipe).
			From("detailbonds").
			Cursor(nil)
		if crsx == nil {
			resdata.IsError = true
			resdata.Message = "109. Cursor Not initialized.."
			resdata.Data = nil
		}
		defer crsx.Close()
		ds := []tk.M{}
		ex = crsx.Fetch(&ds, 0, false)
		if ex != nil {
			resdata.IsError = true
			resdata.Message = "115. " + ex.Error()
			resdata.Data = nil
		}

		TotalExist := make(map[string]int, 0)
		Firm := make(map[string]float64, 0)
		Allocation := make(map[string]float64, 0)
		investor := tk.M{}
		for _, process := range ds {
			child := process["_id"].(tk.M)
			payGrp := child.GetString("grouppayload")
			issuer := child.GetString("issuer")
			investor.Set(payGrp, payGrp)
			Firm[payGrp] += process.GetFloat64("firm")
			Allocation[payGrp] += process.GetFloat64("allocated")
			for _, listCheck := range payload.Issuerdetail {
				check := listCheck.(string)
				if issuer == check {
					TotalExist[payGrp] += 1
				}
			}

			if payload.Flag == "Uninvestor" {
				for _, listCheck2 := range payload.Issuerdetail2 {
					check2 := listCheck2.(string)
					if issuer == check2 {
						TotalExist[payGrp] -= 1
					}
				}
			}

		}

		maxCheck := len(payload.Issuerdetail)
		for _, finalProcess := range investor {
			inv := finalProcess.(string)
			if TotalExist[inv] == maxCheck {
				obj := tk.M{}
				obj.Set("_id", inv)
				obj.Set("firm", Firm[inv])
				obj.Set("allocated", Allocation[inv])
				result = append(result, obj)
				if Allocation[inv] > max {
					max = Allocation[inv]
				}
				count++
			}
		}
	}

	final := tk.M{}.Set("max", max).Set("data", result)

	resdata.Data = final
	resdata.Total = count
	resdata.IsError = false
	resdata.Message = "Get Data Success"
	return resdata
}
