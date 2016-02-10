package hive

import (
	"fmt"
	"os/exec"
)

type FnHiveReceive func(string) (interface{}, error)

const (
	ExecuteCommand = "beeline -u jdbc:hive2://"
)

type Hive struct {
	Server      string
	User        string
	Password    string
	Database    string
	HiveCommand string
}

func SetHostInfo(Server string, User string, Password string, Database string) *Hive {
	Host := Hive{}
	Host.Server = Server
	Host.User = User
	Host.Password = Password
	Host.Database = Database

	return &Host
}

func (h *Hive) Connect() {
	//e := exec.Command("beeline", "")
	out, err := exec.Command("beeline", "").Output()

	if err != nil {
		fmt.Println(err)
	}

	fmt.Println(string(out))

	//return nil
}

// func (h *Hive) Exec(query *string, fn FnHiveReceive) (hs *HiveSession, e error) {
// 	return nil
// }

// func (h *Hive) ExecFile(filepath *string, fn FnHiveReceive) (hs *HiveSession, e error) {
// 	return nil
// }
