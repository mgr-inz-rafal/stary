use std::io::Result;

fn main() -> Result<()> {
    println!("cargo:rerun-if-changed=../proto/types.proto");

    let mut config = prost_build::Config::new();
    config.type_attribute(".", "#[derive(serde::Serialize, serde::Deserialize)]");
    config.type_attribute(".", "#[serde(rename_all = \"camelCase\")]");
    config.compile_protos(&["../proto/types.proto"], &["../proto/"])?;
    Ok(())
}
