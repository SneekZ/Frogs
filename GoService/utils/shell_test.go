package utils

import (
	"os/exec"
	"testing"
)

func TestShellQuote(t *testing.T) {
	for _, s := range []string{"", "a b", `$(touch /tmp/pwned)`, "`id`", `it's "x"`, `\`, "'", "a\nb"} {
		out, err := exec.Command("/bin/bash", "-c", "printf %s "+ShellQuote(s)).Output()
		if err != nil || string(out) != s {
			t.Errorf("ShellQuote(%q): bash вернул %q, %v", s, out, err)
		}
	}
}
