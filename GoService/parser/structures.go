package parser

type Base interface {
	GetFolderName() string
	GetContainerName() string
}

type Sign struct {
	Issuer             Issuer    `json:"issuer"`
	Subject            Subject   `json:"subject"`
	Serial             string    `json:"serial"`
	Thumbprint         string    `json:"thumbprint"`
	SubjKey            string    `json:"subjkey"`
	SignatureAlgorithm string    `json:"signaturealgorithm"`
	PublicKeylgorithm  string    `json:"publickeyalgorithm"`
	NotValidBefore     int64     `json:"notvalidbefore"`
	NotValidAfter      int64     `json:"notvalidafter"`
	Container          Container `json:"container"`
	ProviderName       string    `json:"providername"`
	Checked            bool      `json:"checked"`
	Valid              bool      `json:"valid"`
	CheckErrors        []string  `json:"checkerror"`
	Password           string    `json:"password"`
	DatabaseIds        []int     `json:"databaseids"`
}

func (s Sign) GetFolderName() string {
	return s.Container.FolderName
}

func (s *Sign) GetContainerName() string {
	return s.Container.Name
}

type Issuer struct {
	E      string `json:"e"`
	S      string `json:"s"`
	INN    string `json:"inn"`
	OGRN   string `json:"ogrn"`
	Street string `json:"street"`
	L      string `json:"l"`
	C      string `json:"c"`
	OU     string `json:"ou"`
	O      string `json:"o"`
	CN     string `json:"cn"`
}

type Subject struct {
	E      string `json:"e"`
	S      string `json:"s"`
	INN    string `json:"inn"`
	OGRN   string `json:"ogrn"`
	Street string `json:"street"`
	L      string `json:"l"`
	C      string `json:"c"`
	OU     string `json:"ou"`
	O      string `json:"o"`
	CN     string `json:"cn"`
	T      string `json:"t"`
	SN     string `json:"sn"`
	G      string `json:"g"`
	SNILS  string `json:"snils"`
}

type Container struct {
	Name       string `json:"name"`
	FolderName string `json:"foldername"`
}

func (c Container) GetFolderName() string {
	return c.FolderName
}

func (c Container) GetContainerName() string {
	return c.Name
}

type License struct {
	LicenseCode      string `json:"licensecode"`
	LicenseErrorCode int    `json:"licenseerrorcode"`
	LicenseActuality string `json:"licenseactuality"`
	LicenseType      string `json:"licensetype"`
}