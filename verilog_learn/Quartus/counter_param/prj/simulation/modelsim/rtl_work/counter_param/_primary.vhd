library verilog;
use verilog.vl_types.all;
entity counter_param is
    generic(
        W               : integer := 4;
        MAX             : vl_logic_vector(31 downto 0)
    );
    port(
        clk             : in     vl_logic;
        rst_n           : in     vl_logic;
        en              : in     vl_logic;
        load            : in     vl_logic;
        up_down         : in     vl_logic;
        din             : in     vl_logic_vector;
        q               : out    vl_logic_vector;
        tc              : out    vl_logic
    );
    attribute mti_svvh_generic_type : integer;
    attribute mti_svvh_generic_type of W : constant is 2;
    attribute mti_svvh_generic_type of MAX : constant is 4;
end counter_param;
