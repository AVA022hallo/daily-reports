library verilog;
use verilog.vl_types.all;
entity clk_div is
    generic(
        DIV             : integer := 4
    );
    port(
        clk_in          : in     vl_logic;
        rst_n           : in     vl_logic;
        clk_out         : out    vl_logic
    );
    attribute mti_svvh_generic_type : integer;
    attribute mti_svvh_generic_type of DIV : constant is 2;
end clk_div;
