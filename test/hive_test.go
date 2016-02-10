package hive

import (
	"testing"
)

func TestHiveConnect(t *testing.T) {
	Host := SetHostInfo("192.168.0.223:10000", "developer", "b1gD@T@", "default")
	println(Host.User)

}

func TestHiveQuery() {

}
