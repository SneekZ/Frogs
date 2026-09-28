package parser

import "testing"

func TestKeepChecks(t *testing.T) {
	c := Container{Name: "c", FolderName: "f.000"}
	old := []Sign{
		{Thumbprint: "AA", Container: c, Checked: true, Valid: true, Password: "p"},
		{Thumbprint: "BB", Container: c, Checked: true, Valid: true},
	}
	fresh := KeepChecks([]Sign{
		{Thumbprint: "aa", Container: c},                          // тот же сертификат — результат переносится
		{Thumbprint: "BB", Container: Container{Name: "другой"}}, // сменился контейнер — проверять заново
		{Thumbprint: "CC", Container: c},                          // новый
	}, old)

	if !fresh[0].Checked || !fresh[0].Valid || fresh[0].Password != "p" {
		t.Fatalf("результат проверки AA потерян: %+v", fresh[0])
	}
	if fresh[1].Checked || fresh[2].Checked {
		t.Fatalf("перенесен чужой результат: %+v %+v", fresh[1], fresh[2])
	}
}

func TestSameSigns(t *testing.T) {
	a := []Sign{{Thumbprint: "AA"}, {Thumbprint: "BB"}}
	if !SameSigns(a, []Sign{a[1], a[0]}) {
		t.Fatal("порядок подписей не должен считаться изменением")
	}
	if SameSigns(a, []Sign{a[0], {Thumbprint: "BB", Checked: true}}) {
		t.Fatal("изменение подписи не замечено")
	}
}
